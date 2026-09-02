import { Router, Response } from 'express';
import { z } from 'zod';
import { Ticket } from '../models/Ticket.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { notifyEmails, createNotification } from '../services/notificationService.js';

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
  senderEmail: z.string().email(),
  message: z.string().min(1),
});

const generateTicketCode = async (): Promise<string> => {
  const count = await Ticket.countDocuments();
  return `TKT-${String(count + 1).padStart(4, '0')}`;
};

// POST /api/tickets — create ticket
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

    const ticketCode = await generateTicketCode();

    const ticket = await Ticket.create({
      ticketCode,
      subject: parsed.data.subject,
      description: parsed.data.description || '',
      employeeId: employee._id,
      department: employee.department,
      ticketType: parsed.data.ticketType || 'General HR',
      priority: parsed.data.priority || 'Medium',
      status: 'Open',
    });

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

// GET /api/tickets/team/:leadEmail — get team tickets for lead
router.get('/team/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
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

// GET /api/tickets/my/:email — employee's own tickets
router.get('/my/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
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

// GET /api/tickets/hr — HR sees only lead-resolved tickets (default: awaiting HR decision)
router.get('/hr', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || 'ALL');

    const filter: Record<string, unknown> =
      status === 'ALL'
        ? { status: { $in: ['Resolved', 'HR In Process'] } }
        : { status };

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

// GET /api/tickets/hr-count — tickets awaiting HR decision count for badge
router.get('/hr-count', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Ticket.countDocuments({ status: { $in: ['Resolved', 'HR In Process'] } });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// PUT /api/tickets/:id/hr-inprocess — HR marks ticket as In Process
router.put('/:id/hr-inprocess', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

// PUT /api/tickets/:id/hr-approve — HR final approval (Close)
router.put('/:id/hr-approve', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

// PUT /api/tickets/:id/hr-reject — HR final rejection
router.put('/:id/hr-reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

// PUT /api/tickets/:id/status — update ticket status (lead-level: cannot Close/Reject — that's HR's final decision)
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

    const previousStatus = ticket.status;
    ticket.status = parsed.data.status;
    await ticket.save();

    // Notify ticket owner employee
    const owner = await Employee.findById(ticket.employeeId);
    if (owner && previousStatus !== ticket.status) {
      const statusMsg: Record<string, string> = {
        'In Progress': 'is now In Progress',
        'Pending': 'is Pending',
        'Open': 'was reopened',
        'Resolved': 'was Resolved by your lead — sent to HR for final decision',
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

// POST /api/tickets/:id/message — add message to ticket
router.post('/:id/message', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = addMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.senderEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
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
