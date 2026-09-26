import { Router, Response } from 'express';
import { z } from 'zod';
import { Leave } from '../models/Leave.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { notifyEmails, createNotification } from '../services/notificationService.js';
import { canAccessEmployee, isHr } from '../utils/access.js';
import { LeaveType } from '../models/LeaveType.js';

const router = Router();

const notifyHrAdmins = async (input: { title: string; message: string; relatedId?: string }): Promise<void> => {
  const hrUsers = await User.find({ role: { $in: ['HR_ADMIN', 'SUPER_ADMIN'] }, isActive: true }).select('email');
  await notifyEmails(hrUsers.map((u) => u.email), { ...input, type: 'leave' });
};

// HR acts as first approver when the employee has no DEPARTMENT_LEAD in their reporting chain (direct report to HR / unassigned)
const hrCanProcessPending = async (leave: { employeeId: unknown; leaveType?: string }): Promise<boolean> => {
  // Leave types flagged "no lead approval required" skip the lead step entirely
  if (leave.leaveType) {
    const lt = await LeaveType.findOne({ name: leave.leaveType }).select('requiresLeadApproval');
    if (lt && !lt.requiresLeadApproval) return true;
  }
  const employee = await Employee.findById(leave.employeeId as string);
  if (!employee?.reportedTo) return true;
  const leadEmployee = await Employee.findById(employee.reportedTo);
  if (!leadEmployee) return true;
  const leadUser = await User.findOne({ email: leadEmployee.email?.toLowerCase() }).select('role');
  return leadUser?.role !== 'DEPARTMENT_LEAD';
};

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

/** Syncs Employee.status between 'On Leave' and 'Active' for the given PKT date. */
const syncEmployeeLeaveStatus = async (employeeId: unknown, date?: string): Promise<void> => {
  const d = date || new Date(Date.now() + 5 * 60 * 60000).toISOString().split('T')[0]; // PKT today
  const activeLeave = await Leave.findOne({
    employeeId,
    status: { $in: ['Approved', 'Final Approved'] },
    startDate: { $lte: d },
    endDate: { $gte: d },
  }).select('_id');
  await Employee.findByIdAndUpdate(employeeId, { status: activeLeave ? 'On Leave' : 'Active' });
};

const ACTIVE_LEAVE_STATUSES = ['Pending', 'In Process', 'Approved', 'Final Approved'];

// POST /api/leaves - employee submits leave request
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

    // Requester may only submit a leave for themself (or their own team member / HR for anyone)
    if (!(await canAccessEmployee(req, parsed.data.employeeEmail))) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    // Validate leave type against active company leave types (self-heals if not configured yet)
    const activeTypes = await LeaveType.find({ isActive: true }).select('name annualQuota');
    if (activeTypes.length > 0) {
      const matched = activeTypes.find((t) => t.name.toLowerCase() === parsed.data.leaveType.trim().toLowerCase());
      if (!matched) {
        res.status(400).json({ error: 'Invalid leave type. Please choose from the available leave types.' });
        return;
      }
      parsed.data.leaveType = matched.name;
    }

    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Overlap check - one active request per date range
    const overlapping = await Leave.findOne({
      employeeId: employee._id,
      status: { $in: ACTIVE_LEAVE_STATUSES },
      startDate: { $lte: parsed.data.endDate },
      endDate: { $gte: parsed.data.startDate },
    }).select('leaveType startDate endDate status');
    if (overlapping) {
      res.status(400).json({
        error: `You already have a ${overlapping.status} ${overlapping.leaveType} request (${overlapping.startDate} to ${overlapping.endDate}) overlapping these dates.`,
      });
      return;
    }

    // Annual quota check (per calendar year of the start date)
    const matchedType = activeTypes.find((t) => t.name === parsed.data.leaveType);
    if (matchedType) {
      const leaveYear = String(parsed.data.startDate).split('-')[0];
      const yearLeaves = await Leave.find({
        employeeId: employee._id,
        leaveType: matchedType.name,
        status: { $in: ACTIVE_LEAVE_STATUSES },
      }).select('totalDays startDate');
      const usedDays = yearLeaves
        .filter((l) => String(l.startDate).startsWith(leaveYear))
        .reduce((sum, l) => sum + (l.totalDays || 0), 0);
      if (usedDays + diffDays > matchedType.annualQuota) {
        res.status(400).json({
          error: `Annual quota exceeded for ${matchedType.name}: ${usedDays} of ${matchedType.annualQuota} days already used/requested. Only ${Math.max(0, matchedType.annualQuota - usedDays)} day(s) remain.`,
        });
        return;
      }
    }

    const leave = await Leave.create({
      employeeId: employee._id,
      leaveType: parsed.data.leaveType,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      totalDays: diffDays,
      reason: parsed.data.reason || '',
      status: 'Pending',
    });

    // Notify lead (if employee reports to someone)
    if (employee.reportedTo) {
      const lead = await Employee.findById(employee.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'New Leave Request',
          message: `${employee.name} requested ${parsed.data.leaveType} (${diffDays} day${diffDays > 1 ? 's' : ''}).`,
          type: 'leave',
          relatedId: String(leave._id),
        });
      }
    }

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

// GET /api/leaves/team/:leadEmail - get team leave requests for lead
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
        leadApprovalDate: l.leadApprovalDate,
        hrApprovalNote: l.hrApprovalNote,
        hrApprovalDate: l.hrApprovalDate,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get team leaves error:', err);
    res.status(500).json({ error: 'Unable to load leave requests.' });
  }
});

// GET /api/leaves/my/:email - employee's own leave history
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

// PUT /api/leaves/:id/approve - lead approves leave
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

    // Leave types without lead approval go straight to HR - leads cannot action them
    const leaveTypeDoc = await LeaveType.findOne({ name: leave.leaveType }).select('requiresLeadApproval');
    if (leaveTypeDoc && !leaveTypeDoc.requiresLeadApproval) {
      res.status(400).json({ error: 'This leave type skips lead approval, HR decides it directly.' });
      return;
    }

    const leadEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const employee = await Employee.findById(leave.employeeId);

    // Only the assigned lead of this employee may approve
    if (!employee || !employee.reportedTo || employee.reportedTo.toString() !== leadEmployee._id.toString()) {
      res.status(403).json({ error: 'Only the assigned lead can approve this request.' });
      return;
    }

    leave.status = 'Approved';
    leave.leadApproverId = leadEmployee._id;
    leave.leadApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.leadApprovalNote = parsed.data?.note || '';
    await leave.save();
    await syncEmployeeLeaveStatus(leave.employeeId, leave.startDate);

    // Notify employee + HR admins
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Leave Approved by Lead',
        message: `${leadEmployee.name} approved your ${leave.leaveType}. Waiting for HR final decision.`,
        type: 'leave',
        relatedId: String(leave._id),
      });
      await notifyHrAdmins({
        title: 'Leave Awaiting HR Decision',
        message: `${employee.name}'s ${leave.leaveType} was approved by lead and needs your final decision.`,
        relatedId: String(leave._id),
      });
    }

    res.json({ success: true, message: 'Leave approved.' });
  } catch (err) {
    console.error('Approve leave error:', err);
    res.status(500).json({ error: 'Unable to approve leave.' });
  }
});

// PUT /api/leaves/:id/reject - lead rejects leave
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

    // Leave types without lead approval go straight to HR - leads cannot action them
    const leaveTypeDoc = await LeaveType.findOne({ name: leave.leaveType }).select('requiresLeadApproval');
    if (leaveTypeDoc && !leaveTypeDoc.requiresLeadApproval) {
      res.status(400).json({ error: 'This leave type skips lead approval, HR decides it directly.' });
      return;
    }

    const leadEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const employee = await Employee.findById(leave.employeeId);

    // Only the assigned lead of this employee may reject
    if (!employee || !employee.reportedTo || employee.reportedTo.toString() !== leadEmployee._id.toString()) {
      res.status(403).json({ error: 'Only the assigned lead can reject this request.' });
      return;
    }

    leave.status = 'Rejected';
    leave.leadApproverId = leadEmployee._id;
    leave.leadApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.leadApprovalNote = parsed.data?.note || '';
    await leave.save();
    await syncEmployeeLeaveStatus(leave.employeeId);

    // Notify employee only (rejected leaves don't go to HR)
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Leave Rejected',
        message: `${leadEmployee.name} rejected your ${leave.leaveType}.${parsed.data?.note ? ` Note: ${parsed.data.note}` : ''}`,
        type: 'leave',
        relatedId: String(leave._id),
      });
    }

    res.json({ success: true, message: 'Leave rejected.' });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ error: 'Unable to reject leave.' });
  }
});

// GET /api/leaves/hr - HR sees lead-approved leaves (default: awaiting HR decision)
router.get('/hr', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status || 'ALL');

    const filter: Record<string, unknown> = status === 'ALL' ? {} : { status };

    const leaves = await Leave.find(filter).sort({ createdAt: -1 }).populate('employeeId', 'name empId department jobTitle');

    const serialized = await Promise.all(leaves.map(async (l) => ({
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
      hrActionable: ['Approved', 'In Process'].includes(l.status) || (l.status === 'Pending' ? await hrCanProcessPending(l) : false),
      leadApprovalNote: l.leadApprovalNote,
      leadApprovalDate: l.leadApprovalDate,
      hrApprovalNote: l.hrApprovalNote,
      hrApprovalDate: l.hrApprovalDate,
      createdAt: l.createdAt.toISOString(),
    })));

    res.json({ leaves: serialized });
  } catch (err) {
    console.error('Get HR leaves error:', err);
    res.status(500).json({ error: 'Unable to load leaves.' });
  }
});

// GET /api/leaves/hr-count - pending HR review count for badge
router.get('/hr-count', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const base = await Leave.countDocuments({ status: { $in: ['Approved', 'In Process'] } });
    const pendingLeaves = await Leave.find({ status: 'Pending' }).select('employeeId');
    let direct = 0;
    for (const p of pendingLeaves) {
      if (await hrCanProcessPending(p)) direct++;
    }
    res.json({ count: base + direct });
  } catch {
    res.json({ count: 0 });
  }
});

// PUT /api/leaves/:id/withdraw - employee withdraws their own pending request
router.put('/:id/withdraw', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
    if (!requester || String(leave.employeeId) !== String(requester._id)) {
      res.status(403).json({ error: 'You can only withdraw your own requests.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({ error: 'Only pending requests can be withdrawn. Contact your lead or HR for requests already in review.' });
      return;
    }

    leave.status = 'Cancelled';
    await leave.save();
    await syncEmployeeLeaveStatus(leave.employeeId);

    // Notify lead + HR admins so their boards stay live
    if (requester.reportedTo) {
      const lead = await Employee.findById(requester.reportedTo);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'Leave Request Withdrawn',
          message: `${requester.name} withdrew their ${leave.leaveType} request.`,
          type: 'leave',
          relatedId: String(leave._id),
        });
      }
    }
    const hrUsers = await User.find({ role: { $in: ['HR_ADMIN', 'SUPER_ADMIN'] }, isActive: true }).select('email');
    await notifyEmails(hrUsers.map((u) => u.email), {
      title: 'Leave Request Withdrawn',
      message: `${requester.name} withdrew their ${leave.leaveType} request.`,
      type: 'leave',
      relatedId: String(leave._id),
    });

    res.json({ success: true, message: 'Leave request withdrawn.' });
  } catch (err) {
    console.error('Withdraw leave error:', err);
    res.status(500).json({ error: 'Unable to withdraw leave request.' });
  }
});

// PUT /api/leaves/:id/hr-inprocess - HR marks leave as In Process
router.put('/:id/hr-inprocess', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = approveRejectSchema.safeParse(req.body);
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Approved' && leave.status !== 'In Process') {
      const directToHr = leave.status === 'Pending' && (await hrCanProcessPending(leave));
      if (!directToHr) {
        res.status(400).json({ error: 'Only lead-approved leaves can be processed.' });
        return;
      }
    }

    const hrEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!hrEmployee) {
      res.status(404).json({ error: 'HR not found.' });
      return;
    }

    const employee = await Employee.findById(leave.employeeId);

    leave.status = 'In Process';
    leave.hrApproverId = hrEmployee._id;
    leave.hrApprovalNote = parsed.data?.note || '';
    await leave.save();

    // Notify employee + lead
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Leave In Process (HR)',
        message: `HR is reviewing your ${leave.leaveType}.`,
        type: 'leave',
        relatedId: String(leave._id),
      });
    }
    if (leave.leadApproverId) {
      const lead = await Employee.findById(leave.leadApproverId);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'Leave In Process (HR)',
          message: `HR is reviewing ${employee?.name || 'an employee'}'s ${leave.leaveType}.`,
          type: 'leave',
          relatedId: String(leave._id),
        });
      }
    }

    res.json({ success: true, message: 'Leave marked as In Process.' });
  } catch (err) {
    console.error('HR in-process leave error:', err);
    res.status(500).json({ error: 'Unable to mark In Process.' });
  }
});

// PUT /api/leaves/:id/hr-approve - HR final approval
router.put('/:id/hr-approve', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = approveRejectSchema.safeParse(req.body);
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Approved' && leave.status !== 'In Process') {
      const directToHr = leave.status === 'Pending' && (await hrCanProcessPending(leave));
      if (!directToHr) {
        res.status(400).json({ error: 'Only lead-approved leaves can be approved by HR.' });
        return;
      }
    }

    const hrEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!hrEmployee) {
      res.status(404).json({ error: 'HR not found.' });
      return;
    }

    const employee = await Employee.findById(leave.employeeId);

    leave.status = 'Final Approved';
    leave.hrApproverId = hrEmployee._id;
    leave.hrApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.hrApprovalNote = parsed.data?.note || '';
    await leave.save();
    await syncEmployeeLeaveStatus(leave.employeeId, leave.startDate);

    // Notify employee + lead
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Leave Finally Approved',
        message: `HR approved your ${leave.leaveType} (${leave.startDate} to ${leave.endDate}).`,
        type: 'leave',
        relatedId: String(leave._id),
      });
    }
    if (leave.leadApproverId) {
      const lead = await Employee.findById(leave.leadApproverId);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'Leave Finally Approved',
          message: `HR approved ${employee?.name || 'an employee'}'s ${leave.leaveType}.`,
          type: 'leave',
          relatedId: String(leave._id),
        });
      }
    }

    res.json({ success: true, message: 'Leave finally approved.' });
  } catch (err) {
    console.error('HR approve leave error:', err);
    res.status(500).json({ error: 'Unable to approve leave.' });
  }
});

// PUT /api/leaves/:id/hr-reject - HR final rejection
router.put('/:id/hr-reject', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = approveRejectSchema.safeParse(req.body);
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Approved' && leave.status !== 'In Process') {
      const directToHr = leave.status === 'Pending' && (await hrCanProcessPending(leave));
      if (!directToHr) {
        res.status(400).json({ error: 'Only lead-approved leaves can be rejected by HR.' });
        return;
      }
    }

    const hrEmployee = await Employee.findOne({ email: req.user?.email?.toLowerCase() });
    if (!hrEmployee) {
      res.status(404).json({ error: 'HR not found.' });
      return;
    }

    const employee = await Employee.findById(leave.employeeId);

    leave.status = 'Rejected';
    leave.hrApproverId = hrEmployee._id;
    leave.hrApprovalDate = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    leave.hrApprovalNote = parsed.data?.note || '';
    await leave.save();
    await syncEmployeeLeaveStatus(leave.employeeId);

    // Notify employee + lead
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Leave Rejected by HR',
        message: `HR rejected your ${leave.leaveType}.${parsed.data?.note ? ` Note: ${parsed.data.note}` : ''}`,
        type: 'leave',
        relatedId: String(leave._id),
      });
    }
    if (leave.leadApproverId) {
      const lead = await Employee.findById(leave.leadApproverId);
      if (lead) {
        await createNotification({
          userEmail: lead.email,
          title: 'Leave Rejected by HR',
          message: `HR rejected ${employee?.name || 'an employee'}'s ${leave.leaveType}.`,
          type: 'leave',
          relatedId: String(leave._id),
        });
      }
    }

    res.json({ success: true, message: 'Leave finally rejected.' });
  } catch (err) {
    console.error('HR reject leave error:', err);
    res.status(500).json({ error: 'Unable to reject leave.' });
  }
});

// GET /api/leaves/pending-count/:leadEmail - pending leave count for badge
router.get('/pending-count/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    if (!isHr(req) && leadParam.toLowerCase() !== req.user!.email.toLowerCase()) {
      res.json({ count: 0 });
      return;
    }
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
