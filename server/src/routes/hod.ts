import { Router, Response } from 'express';
import { Attendance, IAttendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { Leave } from '../models/Leave.js';
import { hodDepartment } from '../utils/access.js';

const router = Router();

const DEPARTMENTS = ['Tech', 'Sales', 'HR'] as const;

const MANAGER_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'HOD'];

/** Live working minutes for an open record: now - clockIn - finished breaks - ongoing break. */
const liveWorkingMinutes = (rec: IAttendance, now: Date): number => {
  if (!rec.clockIn) return 0;
  if (rec.clockOut) return rec.workingMinutes || 0;
  if (!rec.clockInAt) return 0;
  let mins = Math.round((now.getTime() - new Date(rec.clockInAt).getTime()) / 60000);
  mins -= rec.breakMinutes || 0;
  if (rec.breakStartedAt) {
    mins -= Math.round((now.getTime() - new Date(rec.breakStartedAt).getTime()) / 60000);
  }
  return Math.max(0, mins);
};

/**
 * GET /api/hod/overview
 * Department-wise live roster for the HOD: every department's leads (premium
 * cards) and employees (simple cards) with today's live attendance status.
 */
router.get('/overview', authenticate, requireRole('HOD', 'HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // HOD sees only their own department; HR / Super Admin see everything
    const hodDept = req.user?.role === 'HOD' ? await hodDepartment(req) : null;
    const empFilter: Record<string, unknown> = { isActive: true };
    if (hodDept) empFilter.department = hodDept;

    const [employees, users, todaysAttendance] = await Promise.all([
      Employee.find(empFilter).select('empId name email department jobTitle avatar reportedTo status'),
      User.find({ isActive: true }).select('email role'),
      Attendance.find({ date: today }),
    ]);

    const employeeIds = employees.map((e) => e._id);
    const scopedAttendance = hodDept ? todaysAttendance.filter((a) => employeeIds.some((id) => String(id) === String(a.employeeId))) : todaysAttendance;

    const onLeaveCount = await Leave.countDocuments({
      status: { $in: ['Approved', 'Final Approved'] },
      startDate: { $lte: today },
      endDate: { $gte: today },
      ...(hodDept ? { employeeId: { $in: employeeIds } } : {}),
    });

    const roleByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.role]));
    const attByEmp = new Map(scopedAttendance.map((a) => [String(a.employeeId), a]));

    const serialize = (e: (typeof employees)[number]) => {
      const rec = attByEmp.get(String(e._id));
      const onBreak = !!(rec && rec.breakStartedAt);
      const live = rec ? liveWorkingMinutes(rec, now) : 0;
      return {
        employeeId: String(e._id),
        empId: e.empId,
        name: e.name,
        email: e.email,
        department: e.department,
        jobTitle: e.jobTitle,
        avatar: e.avatar || '',
        empStatus: e.status,
        reportedTo: e.reportedTo ? String(e.reportedTo) : null,
        attendance: {
          clockIn: rec?.clockIn || null,
          clockInAt: rec?.clockInAt || null,
          clockOut: rec?.clockOut || null,
          workingMinutes: live,
          breakMinutes: rec?.breakMinutes || 0,
          onBreak,
          breakType: onBreak ? rec?.breakType || null : null,
          breakStartedAt: onBreak ? rec?.breakStartedAt || null : null,
          status: rec?.status || null,
        },
      };
    };

    const sections = DEPARTMENTS.map((dept) => {
      const members = employees.filter((e) => e.department === dept);      const leads = members
        .filter((e) => MANAGER_ROLES.includes(roleByEmail.get(e.email.toLowerCase()) || 'EMPLOYEE'))
        .sort((a, b) => (roleByEmail.get(a.email.toLowerCase()) === 'HOD' ? -1 : roleByEmail.get(b.email.toLowerCase()) === 'HOD' ? 1 : 0))
        .map(serialize);
      const staff = members
        .filter((e) => !MANAGER_ROLES.includes(roleByEmail.get(e.email.toLowerCase()) || 'EMPLOYEE'))
        .sort((a, b) => a.empId.localeCompare(b.empId))
        .map(serialize);
      const all = [...leads, ...staff];
      return {
        department: dept,
        totals: {
          staff: all.length,
          clockedIn: all.filter((p) => p.attendance.clockIn && !p.attendance.clockOut).length,
          completed: all.filter((p) => p.attendance.clockOut).length,
          onBreak: all.filter((p) => p.attendance.onBreak).length,
          notIn: all.filter((p) => !p.attendance.clockIn && p.empStatus === 'Active').length,
          onLeave: all.filter((p) => p.empStatus === 'On Leave').length,
        },
        leads,
        employees: staff,
      };
    });

    res.json({
      date: today,
      serverTime: now.toISOString(),
      department: hodDept,
      summary: {
        totalStaff: employees.length,
        clockedIn: sections.reduce((n, s) => n + s.totals.clockedIn, 0),
        onBreak: sections.reduce((n, s) => n + s.totals.onBreak, 0),
        notIn: sections.reduce((n, s) => n + s.totals.notIn, 0),
        onLeave: onLeaveCount,
      },
      // HOD only gets their own department section
      sections: hodDept ? sections.filter((s) => s.department === hodDept) : sections,
    });
  } catch (err) {
    console.error('HOD overview error:', err);
    res.status(500).json({ error: 'Unable to load HOD overview.' });
  }
});

export default router;
