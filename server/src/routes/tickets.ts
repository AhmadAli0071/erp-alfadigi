import { Router, Response } from 'express';
import { z } from 'zod';
import { Ticket } from '../models/Ticket.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const createTicketSchema = z.object({
  employeeEmail: z.string().email(),
  subject: z.string().min(1),
  description: z.string().optional(),
  ticketType: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['Open', 'Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected']),
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

// PUT /api/tickets/:id/status — update ticket status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: { status: parsed.data.status } },
      { new: true }
    );

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
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
