import { Router, Response } from 'express';
import { z } from 'zod';
import { Ticket } from '../models/Ticket.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { notifyEmails, createNotification } from '../services/notificationService.js';
import { canAccessEmployee, isHr } from '../utils/access.js';

const router = Router();

const notifyHrAdmins = async (input: { title: string; message: string; relatedId?: string }): Promise<void> => {
  const hrUsers = await User.find({ role: { $in: ['HR_ADMIN', 'SUPER_ADMIN'] }, isActive: true }).select('email');
  await notifyEmails(hrUsers.map((u) => u.email), { ...input, type: 'ticket' });
};

const createTicketSchema = z.object({
  employeeEmail: z.string().email(),
  subject: z.string().min(1),
  description: z.string().optional(),
  ticketType: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['Open', 'Pending', 'In Progress', 'Resolved', 'HR In Process', 'Closed', 'Rejected']),
});

const addMessageSchema = z.object({
  senderEmail: z.string().email().optional(),
  message: z.string().min(1),
});

const generateTicketCode = async (): Promise<string> => {
  // Max-based: safe against deleted tickets (count+1 could collide with an existing code)
  const codes = await Ticket.find({}).select('ticketCode').lean();
  const maxNum = codes.reduce((m, t) => Math.max(m, parseInt(String(t.ticketCode).replace('TKT-', ''), 10) || 0), 0);
  return `TKT-${String(maxNum + 1).padStart(4, '0')}`;
};

// POST /api/tickets - create ticket
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    // Requester may only create a ticket for themself (or their own team member / HR for anyone)
    if (!(await canAccessEmployee(req, parsed.data.employeeEmail))) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    let ticket;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        ticket = await Ticket.create({
          ticketCode: await generateTicketCode(),
          subject: parsed.data.subject,
          description: parsed.data.description || '',
          employeeId: employee._id,
          department: employee.department,
          ticketType: parsed.data.ticketType || 'General HR',
          priority: parsed.data.priority || 'Medium',
          status: 'Open',
        });
        break;
      } catch (err) {
        const dupCode = (err as { code?: number })?.code;
        if (dupCode !== 11000 || attempt === 4) throw err;
      }
    }
    if (!ticket) {
      throw new Error('Ticket creation failed.');
    }

    // Notify lead (if employee reports to someone)
    if (employee.reportedTo) {
      const lead = await Employee.findById(employee.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'New Ticket Created',
          message: `${employee.name} created ticket ${ticket.ticketCode}: "${ticket.subject}" (${ticket.priority}).`,
          type: 'ticket',
          relatedId: String(ticket._id),
        });
      }
    }

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
      },
    });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Unable to create ticket.' });
  }
});

// GET /api/tickets/team/:leadEmail - get team tickets for lead
router.get('/team/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    if (!isHr(req) && leadParam.toLowerCase() !== req.user!.email.toLowerCase()) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    const status = String(req.query.status || 'ALL');

    const leadEmployee = leadParam.includes('@')
      ? await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true })
      : await Employee.findById(leadParam);

    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const teamMembers = await Employee.find({ reportedTo: leadEmployee._id, isActive: true });
    const teamIds = teamMembers.map((m) => m._id);

    const filter: Record<string, unknown> = { employeeId: { $in: teamIds } };
    if (status !== 'ALL') filter.status = status;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).populate('employeeId', 'name empId department');

    res.json({
      tickets: tickets.map((t) => ({
        id: t._id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        description: t.description,
        employeeId: (t.employeeId as unknown as { _id: { toString(): string }; name: string; empId: string; department: string }),
        employeeName: (t.employeeId as unknown as { name: string }).name,
        employeeCode: (t.employeeId as unknown as { empId: string }).empId,
        department: (t.employeeId as unknown as { department: string }).department || t.department,
        ticketType: t.ticketType,
        priority: t.priority,
        status: t.status,
        messages: t.messages.map((m, i) => ({
          id: `msg_${i}`,
          senderName: m.senderName,
          senderRole: m.senderRole,
          message: m.message,
          timestamp: m.timestamp?.toISOString() || '',
        })),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get team tickets error:', err);
    res.status(500).json({ error: 'Unable to load tickets.' });
  }
});

// GET /api/tickets/my/:email - employee's own tickets
router.get('/my/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetEmail = String(req.params.email).toLowerCase();
    if (!(await canAccessEmployee(req, targetEmail))) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    const employee = await Employee.findOne({ email: targetEmail, isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const tickets = await Ticket.find({ employeeId: employee._id }).sort({ createdAt: -1 });

    res.json({
      tickets: tickets.map((t) => ({
        id: t._id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        description: t.description,
        ticketType: t.ticketType,
        priority: t.priority,
        status: t.status,
        messages: t.messages.map((m, i) => ({
          id: `msg_${i}`,
          senderName: m.senderName,
          senderRole: m.senderRole,
          message: m.message,
          timestamp: m.timestamp?.toISOString() || '',
        })),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get my tickets error:', err);
    res.status(500).json({ error: 'Unable to load tickets.' });
  }
});

// GET /api/tickets/hr - HR sees only lead-resolved tickets (default: awaiting HR decision)
router.get('/hr', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || 'ALL');

    const filter: Record<string, unknown> = status === 'ALL' ? {} : { status };

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).populate('employeeId', 'name empId department');

    res.json({
      tickets: tickets.map((t) => ({
        id: t._id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        description: t.description,
        employeeName: (t.employeeId as unknown as { name: string }).name,
        employeeCode: (t.employeeId as unknown as { empId: string }).empId,
        department: (t.employeeId as unknown as { department: string }).department || t.department,
        ticketType: t.ticketType,
        priority: t.priority,
        status: t.status,
        messages: t.messages.map((m, i) => ({
          id: `msg_${i}`,
          senderName: m.senderName,
          senderRole: m.senderRole,
          message: m.message,
          timestamp: m.timestamp?.toISOString() || '',
        })),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get HR tickets error:', err);
    res.status(500).json({ error: 'Unable to load tickets.' });
  }
});

// GET /api/tickets/hr-count - tickets awaiting HR action count for badge
router.get('/hr-count', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Ticket.countDocuments({ status: { $nin: ['Closed', 'Rejected', 'Cancelled'] } });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// PUT /api/tickets/:id/hr-inprocess - HR marks ticket as In Process
// PUT /api/tickets/:id/withdraw - employee withdraws their own untouched ticket
router.put('/:id/withdraw', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
    if (!requester || String(ticket.employeeId) !== String(requester._id)) {
      res.status(403).json({ error: 'You can only withdraw your own tickets.' });
      return;
    }

    if (!['Open', 'Pending'].includes(ticket.status)) {
      res.status(400).json({ error: 'Only Open or Pending tickets can be withdrawn.' });
      return;
    }

    ticket.status = 'Cancelled';
    await ticket.save();

    // Notify lead + HR admins so their boards stay live
    if (requester.reportedTo) {
      const lead = await Employee.findById(requester.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: `Ticket ${ticket.ticketCode} Withdrawn`,
          message: `${requester.name} withdrew ticket "${ticket.subject}".`,
          type: 'ticket',
          relatedId: String(ticket._id),
        });
      }
    }
    await notifyHrAdmins({
      title: `Ticket ${ticket.ticketCode} Withdrawn`,
      message: `${requester.name} withdrew ticket "${ticket.subject}".`,
      relatedId: String(ticket._id),
    });

    res.json({ success: true, message: 'Ticket withdrawn.' });
  } catch (err) {
    console.error('Withdraw ticket error:', err);
    res.status(500).json({ error: 'Unable to withdraw ticket.' });
  }
});

router.put('/:id/hr-inprocess', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'HR In Process') {
      res.status(400).json({ error: 'Only lead-resolved tickets can be processed by HR.' });
      return;
    }

    ticket.status = 'HR In Process';
    await ticket.save();

    // Notify owner + lead
    const owner = await Employee.findById(ticket.employeeId);
    if (owner) {
      await createNotification({
        userEmail: owner.email,
        title: `Ticket ${ticket.ticketCode} In Process (HR)`,
        message: `HR is reviewing your ticket "${ticket.subject}".`,
        type: 'ticket',
        relatedId: String(ticket._id),
      });
    }
    if (owner?.reportedTo) {
      const lead = await Employee.findById(owner.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: `Ticket ${ticket.ticketCode} In Process (HR)`,
          message: `HR is reviewing ${owner.name}'s ticket "${ticket.subject}".`,
          type: 'ticket',
          relatedId: String(ticket._id),
        });
      }
    }

    res.json({ success: true, status: ticket.status });
  } catch (err) {
    console.error('HR in-process ticket error:', err);
    res.status(500).json({ error: 'Unable to mark In Process.' });
  }
});

// PUT /api/tickets/:id/hr-approve - HR final approval (Close)
router.put('/:id/hr-approve', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'HR In Process') {
      res.status(400).json({ error: 'Only lead-resolved tickets can be approved by HR.' });
      return;
    }

    ticket.status = 'Closed';
    await ticket.save();

    // Notify owner + lead
    const owner = await Employee.findById(ticket.employeeId);
    if (owner) {
      await createNotification({
        userEmail: owner.email,
        title: `Ticket ${ticket.ticketCode} Approved`,
        message: `HR approved and closed your ticket "${ticket.subject}".`,
        type: 'ticket',
        relatedId: String(ticket._id),
      });
    }
    if (owner?.reportedTo) {
      const lead = await Employee.findById(owner.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: `Ticket ${ticket.ticketCode} Approved`,
          message: `HR approved and closed ${owner.name}'s ticket "${ticket.subject}".`,
          type: 'ticket',
          relatedId: String(ticket._id),
        });
      }
    }

    res.json({ success: true, status: ticket.status });
  } catch (err) {
    console.error('HR approve ticket error:', err);
    res.status(500).json({ error: 'Unable to approve ticket.' });
  }
});

// PUT /api/tickets/:id/hr-reject - HR final rejection
router.put('/:id/hr-reject', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'HR In Process') {
      res.status(400).json({ error: 'Only lead-resolved tickets can be rejected by HR.' });
      return;
    }

    ticket.status = 'Rejected';
    await ticket.save();

    // Notify owner + lead
    const owner = await Employee.findById(ticket.employeeId);
    if (owner) {
      await createNotification({
        userEmail: owner.email,
        title: `Ticket ${ticket.ticketCode} Rejected`,
        message: `HR rejected your ticket "${ticket.subject}".`,
        type: 'ticket',
        relatedId: String(ticket._id),
      });
    }
    if (owner?.reportedTo) {
      const lead = await Employee.findById(owner.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: `Ticket ${ticket.ticketCode} Rejected`,
          message: `HR rejected ${owner.name}'s ticket "${ticket.subject}".`,
          type: 'ticket',
          relatedId: String(ticket._id),
        });
      }
    }

    res.json({ success: true, status: ticket.status });
  } catch (err) {
    console.error('HR reject ticket error:', err);
    res.status(500).json({ error: 'Unable to reject ticket.' });
  }
});

// PUT /api/tickets/:id/status - update ticket status (lead-level: cannot Close/Reject - that's HR's final decision)
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    if (parsed.data.status === 'Closed' || parsed.data.status === 'Rejected' || parsed.data.status === 'HR In Process') {
      res.status(403).json({ error: 'Only HR can make the final decision (Close/Reject).' });
      return;
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (ticket.status === 'Cancelled') {
      res.status(400).json({ error: 'This ticket was withdrawn and can no longer be updated.' });
      return;
    }

    // Only the ticket owner, their lead, or HR may change status
    const owner = await Employee.findById(ticket.employeeId);
    if (!owner) {
      res.status(404).json({ error: 'Ticket owner not found.' });
      return;
    }
    if (!isHr(req) && owner.email.toLowerCase() !== req.user!.email.toLowerCase()) {
      const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
      const isLead = !!requester && !!owner.reportedTo && owner.reportedTo.toString() === requester._id.toString();
      if (!isLead) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return;
      }
    }

    const previousStatus = ticket.status;
    ticket.status = parsed.data.status;
    await ticket.save();

    // Notify ticket owner employee (owner already resolved above)
    if (owner && previousStatus !== ticket.status) {
      const statusMsg: Record<string, string> = {
        'In Progress': 'is now In Progress',
        'Pending': 'is Pending',
        'Open': 'was reopened',
        'Resolved': 'was Resolved by your lead, sent to HR for final decision',
      };
      await createNotification({
        userEmail: owner.email,
        title: `Ticket ${ticket.ticketCode} Update`,
        message: `Your ticket "${ticket.subject}" ${statusMsg[ticket.status] || `changed to ${ticket.status}`}.`,
        type: 'ticket',
        relatedId: String(ticket._id),
      });
    }

    // If resolved by lead → notify HR admins
    if (parsed.data.status === 'Resolved') {
      const ownerName = owner?.name || 'An employee';
      await notifyHrAdmins({
        title: 'Ticket Awaiting HR Decision',
        message: `${ownerName}'s ticket ${ticket.ticketCode} ("${ticket.subject}") was resolved by lead and needs your final decision.`,
        relatedId: String(ticket._id),
      });
    }

    res.json({ success: true, status: ticket.status });
  } catch (err) {
    console.error('Update ticket status error:', err);
    res.status(500).json({ error: 'Unable to update status.' });
  }
});

// POST /api/tickets/:id/message - add message to ticket
router.post('/:id/message', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = addMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    // Sender identity always comes from the JWT - client-supplied senderEmail is ignored
    const employee = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (['Closed', 'Rejected', 'Cancelled'].includes(ticket.status)) {
      console.log(`[tickets] Message blocked on ${ticket.ticketCode} - status ${ticket.status}`);
      res.status(400).json({
        error: ticket.status === 'Cancelled'
          ? 'This ticket was withdrawn and is now read-only.'
          : `This ticket is ${ticket.status}. No further messages can be sent.`,
      });
      return;
    }

    // Only participants (owner, owner's lead, HR) may reply
    const ticketOwner = await Employee.findById(ticket.employeeId);
    if (!ticketOwner) {
      res.status(404).json({ error: 'Ticket owner not found.' });
      return;
    }
    const isOwner = ticketOwner.email.toLowerCase() === employee.email.toLowerCase();
    const isLead = !!ticketOwner.reportedTo && ticketOwner.reportedTo.toString() === employee._id.toString();
    if (!isOwner && !isLead && !isHr(req)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    ticket.messages.push({
      senderId: employee._id,
      senderName: employee.name,
      senderRole: req.user?.role || 'Employee',
      message: parsed.data.message,
      timestamp: new Date(),
    });

    await ticket.save();

    // Notify ticket owner if someone else replied
    const owner = await Employee.findById(ticket.employeeId);
    if (owner && owner.email.toLowerCase() !== employee.email.toLowerCase()) {
      await createNotification({
        userEmail: owner.email,
        title: `New Reply on ${ticket.ticketCode}`,
        message: `${employee.name} replied to your ticket "${ticket.subject}".`,
        type: 'ticket',
        relatedId: String(ticket._id),
      });
    } else if (owner) {
      // Owner replied - notify HR admins so the conversation stays live for them
      await notifyHrAdmins({
        title: `New Reply on ${ticket.ticketCode}`,
        message: `${employee.name} replied to ticket "${ticket.subject}".`,
        relatedId: String(ticket._id),
      });
    }

    const newMsg = ticket.messages[ticket.messages.length - 1];

    res.json({
      success: true,
      message: {
        id: `msg_${ticket.messages.length - 1}`,
        senderName: employee.name,
        senderRole: req.user?.role || 'Employee',
        message: parsed.data.message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Unable to add message.' });
  }
});

export default router;
