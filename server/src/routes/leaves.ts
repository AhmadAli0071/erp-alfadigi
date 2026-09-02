import { Router, Response } from 'express';
import { z } from 'zod';
import { Leave } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const createLeaveSchema = z.object({
  employeeEmail: z.string().email(),
  leaveType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

const approveRejectSchema = z.object({
  note: z.string().optional(),
});

// POST /api/leaves — employee submits leave request
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employeeId: employee._id,
      leaveType: parsed.data.leaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      totalDays: diffDays,
      reason: parsed.data.reason || '',
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      leave: {
        id: leave._id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        status: leave.status,
      },
    });
  } catch (err) {
    console.error('Create leave error:', err);
    res.status(500).json({ error: 'Unable to submit leave request.' });
  }
});

// GET /api/leaves/team/:leadEmail — get team leave requests for lead
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

    const leaves = await Leave.find(filter).sort({ createdAt: -1 }).populate('employeeId', 'name empId department jobTitle');

    res.json({
      leaves: leaves.map((l) => ({
        id: l._id,
        employeeId: (l.employeeId as unknown as { _id: { toString(): string }; name: string; empId: string; department: string; jobTitle: string }),
        employeeName: (l.employeeId as unknown as { name: string }).name,
        employeeCode: (l.employeeId as unknown as { empId: string }).empId,
        department: (l.employeeId as unknown as { department: string }).department,
        jobTitle: (l.employeeId as unknown as { jobTitle: string }).jobTitle,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        totalDays: l.totalDays,
        reason: l.reason,
        status: l.status,
        leadApprovalNote: l.leadApprovalNote,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get team leaves error:', err);
    res.status(500).json({ error: 'Unable to load leave requests.' });
  }
});

// GET /api/leaves/my/:email — employee's own leave history
router.get('/my/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const leaves = await Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 });

    res.json({
      leaves: leaves.map((l) => ({
        id: l._id,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        totalDays: l.totalDays,
        reason: l.reason,
        status: l.status,
        leadApprovalNote: l.leadApprovalNote,
        hrApprovalNote: l.hrApprovalNote,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get my leaves error:', err);
    res.status(500).json({ error: 'Unable to load leave history.' });
  }
});

// PUT /api/leaves/:id/approve — lead approves leave
router.put('/:id/approve', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = approveRejectSchema.safeParse(req.body);
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({ error: 'Leave request is not pending.' });
      return;
    }

    const leadEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    leave.status = 'Approved';
    leave.leadApproverId = leadEmployee._id;
    leave.leadApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.leadApprovalNote = parsed.data?.note || '';
    await leave.save();

    res.json({ success: true, message: 'Leave approved.' });
  } catch (err) {
    console.error('Approve leave error:', err);
    res.status(500).json({ error: 'Unable to approve leave.' });
  }
});

// PUT /api/leaves/:id/reject — lead rejects leave
router.put('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = approveRejectSchema.safeParse(req.body);
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({ error: 'Leave request is not pending.' });
      return;
    }

    const leadEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    leave.status = 'Rejected';
    leave.leadApproverId = leadEmployee._id;
    leave.leadApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.leadApprovalNote = parsed.data?.note || '';
    await leave.save();

    res.json({ success: true, message: 'Leave rejected.' });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ error: 'Unable to reject leave.' });
  }
});

// GET /api/leaves/pending-count/:leadEmail — pending leave count for badge
router.get('/pending-count/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    const leadEmployee = leadParam.includes('@')
      ? await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true })
      : await Employee.findById(leadParam);

    if (!leadEmployee) {
      res.json({ count: 0 });
      return;
    }

    const teamMembers = await Employee.find({ reportedTo: leadEmployee._id, isActive: true });
    const teamIds = teamMembers.map((m) => m._id);
    const count = await Leave.countDocuments({ employeeId: { $in: teamIds }, status: 'Pending' });

    res.json({ count });
  } catch (err) {
    console.error('Get pending count error:', err);
    res.json({ count: 0 });
  }
});

export default router;
