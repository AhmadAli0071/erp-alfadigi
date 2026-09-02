import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const createEmployeeSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  department: z.enum(['HR', 'Sales', 'Tech']),
  jobTitle: z.string().min(1, 'Job title is required'),
  phone: z.string().optional(),
  joinedDate: z.string().min(1, 'Join date is required'),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.enum(['HR', 'Sales', 'Tech']).optional(),
  jobTitle: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
  reportedTo: z.string().nullable().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET /api/employees — list all employees
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employees = await Employee.find({ isActive: true })
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

// GET /api/employees/team/:leadId — get team members for a lead (by employee ID or email)
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

// GET /api/employees/leads — get all department leads (for dropdown)
router.get('/leads', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leads = await Employee.find({
      status: 'Active',
      $or: [
        { jobTitle: { $regex: /lead/i } },
        { jobTitle: { $regex: /director/i } },
        { jobTitle: { $regex: /head/i } },
        { jobTitle: { $regex: /manager/i } },
      ],
    }).sort({ name: 1 });

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

// GET /api/employees/me/:email — my own profile (with lead info + quick stats)
router.get('/me/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({
      email: String(req.params.email).toLowerCase(),
      isActive: true,
    }).populate('reportedTo', 'name empId jobTitle department email');

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const lead = employee.reportedTo as unknown as
      | { _id: { toString(): string }; name: string; empId: string; jobTitle: string; department: string; email: string }
      | null;

    // Quick stats: attendance this month + leaves
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

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

// GET /api/employees/:id — get single employee
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
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
      status: employee.status,
    });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Unable to load employee.' });
  }
});

// POST /api/employees — create employee (HR only)
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

      const { userId, name, email, department, jobTitle, phone, joinedDate } = parsed.data;

      const existing = await Employee.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409).json({ error: 'An employee with this email already exists.' });
        return;
      }

      const count = await Employee.countDocuments();
      const empId = `EMP-${String(count + 1).padStart(3, '0')}`;

      const employee = await Employee.create({
        userId: userId || undefined,
        empId,
        name,
        email: email.toLowerCase(),
        department,
        jobTitle,
        phone: phone || '',
        joinedDate,
        status: 'Active',
      });

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

// PUT /api/employees/:id — update employee (HR only)
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

      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      if (!employee) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      // Sync email/name changes to User model
      if (updateData.email || updateData.name) {
        const userUpdate: Record<string, string> = {};
        if (updateData.email) userUpdate.email = updateData.email.toLowerCase();
        if (updateData.name) userUpdate.name = updateData.name;
        await User.findOneAndUpdate({ email: employee.email }, { $set: userUpdate });
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

// DELETE /api/employees/:id — soft delete (HR only)
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

      res.json({ success: true, message: 'Employee deactivated.' });
    } catch (err) {
      console.error('Delete employee error:', err);
      res.status(500).json({ error: 'Unable to deactivate employee.' });
    }
  }
);

// PUT /api/employees/:id/reset-password — HR resets employee password
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
