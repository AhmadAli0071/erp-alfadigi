import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Ticket } from '../models/Ticket.js';
import { Notification } from '../models/Notification.js';
import { SalaryChangeRequest } from '../models/SalaryChangeRequest.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { canAccessEmployee, isHr } from '../utils/access.js';

const router = Router();

const createEmployeeSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  department: z.enum(['HR', 'Sales', 'Tech']),
  jobTitle: z.string().min(1, 'Job title is required'),
  salary: z.coerce.number().min(0, 'Salary cannot be negative').optional(),
  phone: z.string().optional(),
  joinedDate: z.string().min(1, 'Join date is required'),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.enum(['HR', 'Sales', 'Tech']).optional(),
  jobTitle: z.string().min(1).optional(),
  salary: z.coerce.number().min(0, 'Salary cannot be negative').optional(),
  phone: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  reportedTo: z.string().nullable().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Salary visibility: Super Admin sees all; HR sees everyone's EXCEPT their own
// (HR's own salary is Super Admin's business); everyone else sees only their own.
const canViewSalary = (req: AuthRequest, employeeEmail: string): boolean => {
  if (!req.user) return false;
  const requesterEmail = req.user.email.toLowerCase();
  if (req.user.role === 'SUPER_ADMIN') return true;
  if (req.user.role === 'HR_ADMIN') return requesterEmail !== employeeEmail.toLowerCase();
  return requesterEmail === employeeEmail.toLowerCase();
};

// Only the Super Admin may set or change salaries
const canEditSalary = (req: AuthRequest): boolean =>
  !!req.user && req.user.role === 'SUPER_ADMIN';

// GET /api/employees - list all employees
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only HR may include deactivated employees
    const includeInactive = isHr(req) && String(req.query.includeInactive || '') === '1';
    const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };
    const employees = await Employee.find(filter)
      .populate('reportedTo', 'name empId jobTitle')
      .sort({ createdAt: -1 });
    res.json({
      employees: employees.map((e) => ({
        id: e._id.toString(),
        empId: e.empId,
        name: e.name,
        email: e.email,
        department: e.department,
        jobTitle: e.jobTitle,
        avatar: e.avatar,
        phone: e.phone,
        joinedDate: e.joinedDate,
        salary: canViewSalary(req, e.email) ? e.salary : undefined,
        status: e.status,
        reportedTo: e.reportedTo
          ? {
              id: (e.reportedTo as unknown as { _id: { toString(): string } })._id.toString(),
              name: (e.reportedTo as unknown as { name: string }).name,
              empId: (e.reportedTo as unknown as { empId: string }).empId,
              jobTitle: (e.reportedTo as unknown as { jobTitle: string }).jobTitle,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).json({ error: 'Unable to load employees.' });
  }
});

// GET /api/employees/team/:leadId - get team members for a lead (by employee ID or email)
router.get('/team/:leadId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadId);
    let leadEmployee;

    if (leadParam.includes('@')) {
      leadEmployee = await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true });
    } else {
      leadEmployee = await Employee.findById(leadParam);
    }

    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    // Leads may only view their own team (HR can view any team)
    if (!isHr(req)) {
      const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
      if (!requester || requester._id.toString() !== leadEmployee._id.toString()) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return;
      }
    }

    const teamMembers = await Employee.find({
      reportedTo: leadEmployee._id,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      lead: {
        id: leadEmployee._id.toString(),
        name: leadEmployee.name,
        department: leadEmployee.department,
      },
      team: teamMembers.map((e) => ({
        id: e._id.toString(),
        empId: e.empId,
        name: e.name,
        email: e.email,
        department: e.department,
        jobTitle: e.jobTitle,
        avatar: e.avatar,
        status: e.status,
        joinedDate: e.joinedDate,
        phone: e.phone,
      })),
    });
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ error: 'Unable to load team.' });
  }
});

// GET /api/employees/leads - get all department leads (for dropdown)
router.get('/leads', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Leads are defined by USER ROLE (DEPARTMENT_LEAD) - not by job title keywords
    const leadUsers = await User.find({ role: 'DEPARTMENT_LEAD', isActive: true }).select('email');
    const leadEmails = leadUsers.map((u) => u.email?.toLowerCase()).filter(Boolean);
    const leads = await Employee.find({ email: { $in: leadEmails }, status: 'Active', isActive: true }).sort({ name: 1 });

    res.json({
      leads: leads.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        department: e.department,
        jobTitle: e.jobTitle,
      })),
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: 'Unable to load leads.' });
  }
});

// GET /api/employees/me/:email - my own profile (with lead info + quick stats)
router.get('/me/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetEmail = String(req.params.email).toLowerCase();
    if (!(await canAccessEmployee(req, targetEmail))) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    const employee = await Employee.findOne({
      email: targetEmail,
      isActive: true,
    }).populate('reportedTo', 'name empId jobTitle department email');

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const lead = employee.reportedTo as unknown as
      | { _id: { toString(): string }; name: string; empId: string; jobTitle: string; department: string; email: string }
      | null;

    // Quick stats: attendance this month + leaves (UTC-based, matching stored dates)
    const now = new Date();
    const monthStartStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;

    const [attendanceCount, presentCount, totalLeaves, approvedLeaves] = await Promise.all([
      Attendance.countDocuments({ employeeId: employee._id, date: { $gte: monthStartStr } }),
      Attendance.countDocuments({ employeeId: employee._id, date: { $gte: monthStartStr }, status: { $in: ['Present', 'Late'] } }),
      Leave.countDocuments({ employeeId: employee._id }),
      Leave.countDocuments({ employeeId: employee._id, status: 'Final Approved' }),
    ]);

    res.json({
      employee: {
        id: employee._id,
        empId: employee.empId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        jobTitle: employee.jobTitle,
        joinedDate: employee.joinedDate,
        status: employee.status,
        salary: canViewSalary(req, employee.email) ? employee.salary : undefined,
        reportedTo: lead
          ? { id: lead._id.toString(), name: lead.name, empId: lead.empId, jobTitle: lead.jobTitle, department: lead.department, email: lead.email }
          : null,
      },
      stats: {
        attendanceDaysThisMonth: attendanceCount,
        presentDaysThisMonth: presentCount,
        totalLeaveRequests: totalLeaves,
        approvedLeaves,
      },
    });
  } catch (err) {
    console.error('Get my profile error:', err);
    res.status(500).json({ error: 'Unable to load profile.' });
  }
});

// GET /api/employees/:id - get single employee
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    if (!(await canAccessEmployee(req, employee.email))) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    res.json({
      id: employee._id.toString(),
      empId: employee.empId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      jobTitle: employee.jobTitle,
      avatar: employee.avatar,
      phone: employee.phone,
      joinedDate: employee.joinedDate,
      salary: canViewSalary(req, employee.email) ? employee.salary : undefined,
      status: employee.status,
    });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Unable to load employee.' });
  }
});

// POST /api/employees - create employee (HR only)
router.post(
  '/',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { userId, name, email, department, jobTitle, salary, phone, joinedDate } = parsed.data;

      const existing = await Employee.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'An employee with this email already exists.' });
        return;
      }

      let employee;
      for (let attempt = 0; attempt < 5; attempt++) {
        const count = await Employee.countDocuments();
        const empId = `EMP-${String(count + 1 + attempt).padStart(3, '0')}`;
        try {
          employee = await Employee.create({
            userId: userId || undefined,
            empId,
            name,
            email: email.toLowerCase(),
            department,
            jobTitle,
            salary: salary || 0,
            phone: phone || '',
            joinedDate,
            status: 'Active',
          });
          break;
        } catch (err) {
          const dupCode = (err as { code?: number })?.code;
          if (dupCode !== 11000 || attempt === 4) throw err;
        }
      }
      if (!employee) {
        throw new Error('Employee creation failed.');
      }

      res.status(201).json({
        success: true,
        employee: {
          id: employee._id.toString(),
          empId: employee.empId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          jobTitle: employee.jobTitle,
          phone: employee.phone,
          salary: employee.salary,
          joinedDate: employee.joinedDate,
          status: employee.status,
        },
      });
    } catch (err) {
      console.error('Create employee error:', err);
      res.status(500).json({ error: 'Unable to create employee.' });
    }
  }
);

// PUT /api/employees/:id - update employee (HR only)
router.put(
  '/:id',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = updateEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const updateData = { ...parsed.data };
      if ('reportedTo' in updateData) {
        updateData.reportedTo = updateData.reportedTo || null;
      }
      // Salary changes are Super Admin only - ignore the field for anyone else
      if (!canEditSalary(req)) {
        delete (updateData as Record<string, unknown>).salary;
      }

      const existingEmployee = await Employee.findById(req.params.id);
      if (!existingEmployee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }
      const previousEmail = existingEmployee.email;
      const previousName = existingEmployee.name;

      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      // Sync email/name changes to the User login - look up by the ORIGINAL email,
      // since the User record still holds the old value when the email changed
      if (updateData.email || updateData.name) {
        const emailChanged = !!updateData.email && updateData.email.toLowerCase() !== previousEmail;
        const nameChanged = !!updateData.name && updateData.name !== previousName;
        if (emailChanged || nameChanged) {
          const userUpdate: Record<string, string> = {};
          if (updateData.email) userUpdate.email = updateData.email.toLowerCase();
          if (updateData.name) userUpdate.name = updateData.name;
          await User.findOneAndUpdate({ email: previousEmail }, { $set: userUpdate });
        }
      }

      res.json({
        success: true,
        employee: {
          id: employee._id.toString(),
          empId: employee.empId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          jobTitle: employee.jobTitle,
          phone: employee.phone,
          salary: employee.salary,
          joinedDate: employee.joinedDate,
          status: employee.status,
        },
      });
    } catch (err) {
      console.error('Update employee error:', err);
      res.status(500).json({ error: 'Unable to update employee.' });
    }
  }
);

// DELETE /api/employees/:id - soft delete (HR only)
router.delete(
  '/:id',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: false, status: 'Inactive' } },
        { new: true }
      );

      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      // Deactivate the login account so a deactivated employee cannot sign in
      await User.updateOne({ email: employee.email }, { $set: { isActive: false } });

      res.json({ success: true, message: 'Employee deactivated.' });
    } catch (err) {
      console.error('Delete employee error:', err);
      res.status(500).json({ error: 'Unable to deactivate employee.' });
    }
  }
);

// DELETE /api/employees/:id/permanent - permanently remove employee + all linked data (HR only)
router.delete(
  '/:id/permanent',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      if (employee.email.toLowerCase() === req.user!.email.toLowerCase()) {
        res.status(400).json({ error: 'You cannot permanently delete your own account.' });
        return;
      }

      const linkedUser = await User.findOne({ email: employee.email.toLowerCase() });
      if (linkedUser?.role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only a Super Admin can permanently delete a Super Admin.' });
        return;
      }

      const deletedUser = linkedUser ? await User.deleteOne({ _id: linkedUser._id }) : null;
      const deletedEmp = await Employee.deleteOne({ _id: employee._id });
      const attendance = await Attendance.deleteMany({ employeeId: employee._id });
      const leaves = await Leave.deleteMany({ employeeId: employee._id });
      const tickets = await Ticket.deleteMany({ employeeId: employee._id });
      const notifications = await Notification.deleteMany({ userEmail: employee.email.toLowerCase() });
      const salaryRequests = await SalaryChangeRequest.deleteMany({
        $or: [{ employeeId: employee._id }, { requestedByEmail: employee.email.toLowerCase() }],
      });
      await Employee.updateMany({ reportedTo: employee._id }, { $set: { reportedTo: null } });

      console.warn(`[audit] Employee permanently deleted: ${employee.email} (${employee.empId}) by ${req.user?.email} from IP ${req.ip}`);

      res.json({
        success: true,
        message: `${employee.name} permanently deleted.`,
        removed: {
          user: deletedUser ? deletedUser.deletedCount : 0,
          employee: deletedEmp.deletedCount,
          attendance: attendance.deletedCount,
          leaves: leaves.deletedCount,
          tickets: tickets.deletedCount,
          notifications: notifications.deletedCount,
          salaryRequests: salaryRequests.deletedCount,
        },
      });
    } catch (err) {
      console.error('Permanent delete employee error:', err);
      res.status(500).json({ error: 'Unable to permanently delete employee.' });
    }
  }
);

// PUT /api/employees/:id/reactivate - re-activate a deactivated employee (HR only)
router.put(
  '/:id/reactivate',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: true, status: 'Active' } },
        { new: true }
      );

      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      // Ensure the login account is also active
      await User.updateOne({ email: employee.email }, { $set: { isActive: true } });

      res.json({ success: true, message: 'Employee re-activated.' });
    } catch (err) {
      console.error('Reactivate employee error:', err);
      res.status(500).json({ error: 'Unable to reactivate employee.' });
    }
  }
);

// PUT /api/employees/:id/reset-password - HR resets employee password
router.put(
  '/:id/reset-password',
  authenticate,
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      const user = await User.findOne({ email: employee.email }).select('+password');
      if (!user) {
        res.status(404).json({ error: 'User account not found for this employee.' });
        return;
      }

      user.password = await bcrypt.hash(parsed.data.newPassword, 12);
      await user.save();

      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Unable to reset password.' });
    }
  }
);

export default router;
