import { Router, Response } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Ticket } from '../models/Ticket.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/* ------------------------------------------------------------------ */
/* DATE HELPERS (UTC-based, matching attendance date keys)             */
/* ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STANDARD_SHIFT_MINUTES = 540; // 6 PM – 3 AM = 9 hours
const FULL_DAY_MINUTES = 480; // 8 hours

const toISODate = (d: Date): string => {
  const yr = d.getUTCFullYear();
  const mon = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${yr}-${mon}-${day}`;
};

const dateLabel = (iso: string): string => {
  const [yr, mon, day] = iso.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${MONTHS[mon - 1]} ${yr}`;
};

const dateShort = (iso: string): string => {
  const [, mon, day] = iso.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${MONTHS[mon - 1]}`;
};

const addDays = (iso: string, days: number): string => {
  const [yr, mon, day] = iso.split('-').map(Number);
  return toISODate(new Date(Date.UTC(yr, mon - 1, day + days)));
};

const hoursLabel = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0 && m === 0) return '0h';
  return `${h}h${m > 0 ? ` ${String(m).padStart(2, '0')}m` : ''}`;
};

const timeLabel = (d: Date): string =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

const resolvePresetRange = (preset: string, startDate?: string, endDate?: string): { start: string; end: string; label: string } => {
  const today = toISODate(new Date());
  const [ty, tm, td] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay(); // 0 = Sun

  switch (preset) {
    case 'today':
      return { start: today, end: today, label: `Today, ${dateLabel(today)}` };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { start: y, end: y, label: `Yesterday, ${dateLabel(y)}` };
    }
    case 'this_week': {
      const monOffset = dow === 0 ? -6 : 1 - dow;
      const start = addDays(today, monOffset);
      return { start, end: today, label: `This Week, ${dateShort(start)} to ${dateShort(today)}` };
    }
    case 'last_week': {
      const monOffset = dow === 0 ? -6 : 1 - dow;
      const thisMon = addDays(today, monOffset);
      const start = addDays(thisMon, -7);
      const end = addDays(start, 6);
      return { start, end, label: `Last Week, ${dateShort(start)} to ${dateShort(end)}` };
    }
    case 'last_7_days': {
      const start = addDays(today, -6);
      return { start, end: today, label: `Last 7 Days, ${dateShort(start)} to ${dateShort(today)}` };
    }
    case 'this_month': {
      const start = `${ty}-${String(tm).padStart(2, '0')}-01`;
      return { start, end: today, label: `This Month, ${MONTHS[tm - 1]} ${ty}` };
    }
    case 'last_month': {
      const d = new Date(Date.UTC(ty, tm - 2, 1));
      const start = toISODate(d);
      const [ly, lm] = start.split('-').map(Number);
      const lastDay = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
      const end = `${ly}-${String(lm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end, label: `Last Month, ${MONTHS[lm - 1]} ${ly}` };
    }
    case 'this_year': {
      const start = `${ty}-01-01`;
      return { start, end: today, label: `This Year, ${ty}` };
    }
    case 'custom': {
      const s = startDate || today;
      const e = endDate || today;
      return { start: s <= e ? s : e, end: s <= e ? e : s, label: `${dateShort(s)} to ${dateShort(e)}` };
    }
    default:
      return { start: today, end: today, label: `Today, ${dateLabel(today)}` };
  }
};

/* ------------------------------------------------------------------ */
/* SHAPED HELPERS                                                      */
/* ------------------------------------------------------------------ */

interface EmployeeRef {
  _id: { toString(): string };
  name: string;
  empId: string;
  department: string;
  jobTitle?: string;
}

const empOf = (doc: { employeeId: unknown }): EmployeeRef =>
  doc.employeeId as unknown as EmployeeRef;

const matchesDept = (dept: string, filter: string): boolean => filter === 'ALL' || dept === filter;

/* ------------------------------------------------------------------ */
/* REPORT CATEGORIES                                                   */
/* ------------------------------------------------------------------ */

const buildAttendanceRows = async (
  start: string,
  end: string,
  department: string,
  status: string,
  search: string
) => {
  const records = await Attendance.find({ date: { $gte: start, $lte: end } })
    .populate('employeeId', 'name empId department')
    .sort({ date: -1 });

  const q = search.toLowerCase();
  const rows = records
    .map((r) => {
      const e = empOf(r);
      const working = r.workingMinutes || 0;
      const short = working > 0 ? Math.max(0, FULL_DAY_MINUTES - working) : 0;
      const extra = Math.max(0, working - STANDARD_SHIFT_MINUTES);
      return {
        id: String(r._id),
        date: r.date,
        employeeName: e.name,
        employeeCode: e.empId,
        department: e.department,
        clockIn: r.clockIn || '-',
        clockOut: r.clockOut || '-',
        breakDuration: r.breakMinutes ? hoursLabel(r.breakMinutes) : '0h',
        workingHours: working > 0 ? hoursLabel(working) : '-',
        shortHours: short > 0 ? hoursLabel(short) : '-',
        extraHours: extra > 0 ? hoursLabel(extra) : '-',
        status: r.status,
      };
    })
    .filter((r) => matchesDept(r.department, department))
    .filter((r) => status === 'ALL' || r.status === status)
    .filter((r) => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q));

  return rows;
};

const buildLeaveRows = async (
  start: string,
  end: string,
  department: string,
  status: string,
  leaveType: string,
  search: string
) => {
  const records = await Leave.find({ startDate: { $lte: end }, endDate: { $gte: start } })
    .populate('employeeId', 'name empId department')
    .sort({ startDate: -1 });

  const q = search.toLowerCase();
  const rows = records
    .map((l) => {
      const e = empOf(l);
      return {
        id: String(l._id),
        employeeName: e.name,
        employeeCode: e.empId,
        department: e.department,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        days: l.totalDays,
        status: l.status,
      };
    })
    .filter((r) => matchesDept(r.department, department))
    .filter((r) => status === 'ALL' || r.status === status)
    .filter((r) => leaveType === 'ALL' || r.leaveType.toLowerCase() === leaveType.toLowerCase())
    .filter((r) => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q) || r.leaveType.toLowerCase().includes(q));

  return rows;
};

const buildOvertimeRows = async (
  start: string,
  end: string,
  department: string,
  status: string,
  search: string
) => {
  const records = await Attendance.find({
    date: { $gte: start, $lte: end },
    workingMinutes: { $gt: STANDARD_SHIFT_MINUTES },
  })
    .populate('employeeId', 'name empId department')
    .sort({ date: -1 });

  const q = search.toLowerCase();
  const rows = records
    .map((r) => {
      const e = empOf(r);
      const extra = (r.workingMinutes || 0) - STANDARD_SHIFT_MINUTES;
      return {
        id: String(r._id),
        employeeName: e.name,
        employeeCode: e.empId,
        department: e.department,
        date: r.date,
        shift: '6:00 PM – 3:00 AM',
        extraBeforeShift: '-',
        extraAfterShift: hoursLabel(extra),
        totalExtraHours: hoursLabel(extra),
        verificationStatus: 'Pending HR Verification',
        hrApproval: '-',
        attendanceStatus: r.status,
      };
    })
    .filter((r) => matchesDept(r.department, department))
    .filter((r) => status === 'ALL' || r.attendanceStatus === status)
    .filter((r) => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q));

  return rows.map(({ attendanceStatus: _ignored, ...rest }) => rest);
};

const buildEmployeeRows = async (department: string, status: string, search: string) => {
  const employees = await Employee.find({}).sort({ name: 1 });

  const q = search.toLowerCase();
  const rows = employees
    .map((e) => ({
      id: String(e._id),
      employeeName: e.name,
      employeeCode: e.empId,
      department: e.department,
      designation: e.jobTitle,
      joiningDate: e.joinedDate || '-',
      status: e.isActive ? e.status : 'Inactive',
    }))
    .filter((r) => matchesDept(r.department, department))
    .filter((r) => status === 'ALL' || r.status === status)
    .filter((r) => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q));

  return rows;
};

const buildDepartmentRows = async (start: string, end: string) => {
  const departments = ['HR', 'Sales', 'Tech'];
  const employees = await Employee.find({ isActive: true }).select('department');
  const records = await Attendance.find({ date: { $gte: start, $lte: end } }).populate('employeeId', 'department');

  const stats: Record<string, { totalEmployees: number; present: number; absent: number; onLeave: number; totalMinutes: number }> = {};
  for (const dept of departments) {
    stats[dept] = { totalEmployees: 0, present: 0, absent: 0, onLeave: 0, totalMinutes: 0 };
  }
  for (const e of employees) {
    if (stats[e.department]) stats[e.department].totalEmployees += 1;
  }
  for (const r of records) {
    const dept = empOf(r).department;
    if (!stats[dept]) continue;
    if (r.status === 'Present' || r.status === 'Late' || r.status === 'Short Hours' || r.status === 'On Duty' || r.status === 'Pending OT' || r.status === 'Work From Home') {
      stats[dept].present += 1;
    } else if (r.status === 'Absent') {
      stats[dept].absent += 1;
    } else if (r.status === 'Leave' || r.status === 'Half Day') {
      stats[dept].onLeave += 1;
    }
    stats[dept].totalMinutes += r.workingMinutes || 0;
  }

  return departments.map((dept) => ({
    id: dept,
    department: dept,
    totalEmployees: stats[dept].totalEmployees,
    present: stats[dept].present,
    absent: stats[dept].absent,
    onLeave: stats[dept].onLeave,
    workingHours: hoursLabel(stats[dept].totalMinutes),
  }));
};

interface ActivitySource {
  createdAt: Date;
  category: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  details: string;
}

const buildActivityRows = async (start: string, end: string, department: string, search: string) => {
  const empFilter: Record<string, unknown> = {};
  if (department !== 'ALL') empFilter.department = department;

  const employees = await Employee.find(empFilter).select('_id name department');
  const empIds = employees.map((e) => e._id);
  const empNameById = new Map(employees.map((e) => [String(e._id), e.name]));

  const [leaves, tickets] = await Promise.all([
    Leave.find({ employeeId: { $in: empIds } }).sort({ createdAt: -1 }).limit(200),
    Ticket.find({ employeeId: { $in: empIds } }).sort({ createdAt: -1 }).limit(200),
  ]);

  const activities: ActivitySource[] = [];

  for (const l of leaves) {
    activities.push({
      createdAt: l.createdAt,
      category: 'Leave',
      actor: empNameById.get(String(l.employeeId)) || 'Unknown',
      actorRole: 'Employee',
      action: `Leave ${l.status}`,
      target: `${l.leaveType} (${l.startDate} → ${l.endDate})`,
      details: l.reason || '-',
    });
  }
  for (const t of tickets) {
    activities.push({
      createdAt: t.createdAt,
      category: 'Ticket',
      actor: empNameById.get(String(t.employeeId)) || 'Unknown',
      actorRole: 'Employee',
      action: `Ticket ${t.status}`,
      target: `${t.ticketCode}: ${t.subject}`,
      details: t.description || '-',
    });
  }

  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const q = search.toLowerCase();
  return activities
    .map((a) => ({
      id: `${a.category}-${a.createdAt.getTime()}-${a.actor}`,
      date: toISODate(a.createdAt),
      time: timeLabel(a.createdAt),
      category: a.category,
      actor: a.actor,
      actorRole: a.actorRole,
      action: a.action,
      target: a.target,
      details: a.details.length > 120 ? `${a.details.slice(0, 120)}…` : a.details,
    }))
    .filter((r) => r.date >= start && r.date <= end)
    .filter((r) => !q || r.actor.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.action.toLowerCase().includes(q));
};

/* ------------------------------------------------------------------ */
/* ROUTE                                                               */
/* ------------------------------------------------------------------ */

// GET /api/reports - HR-only report engine across all categories
router.get('/', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.query;
    const category = String(q.category || 'attendance');
    const preset = String(q.datePreset || 'this_month');
    const { start, end, label } = resolvePresetRange(preset, q.startDate as string, q.endDate as string);
    const department = String(q.department || 'ALL');
    const status = String(q.status || 'ALL');
    const leaveType = String(q.leaveType || 'ALL');
    const search = String(q.searchQuery ?? q.search ?? '').trim();
    const page = Math.max(1, parseInt(String(q.page || '1'), 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(String(q.pageSize || '20'), 10)));

    let allRows: Record<string, unknown>[];
    switch (category) {
      case 'leave':
        allRows = await buildLeaveRows(start, end, department, status, leaveType, search);
        break;
      case 'overtime':
        allRows = await buildOvertimeRows(start, end, department, status, search);
        break;
      case 'employee':
        allRows = await buildEmployeeRows(department, status, search);
        break;
      case 'department':
        allRows = await buildDepartmentRows(start, end);
        break;
      case 'activity':
        allRows = await buildActivityRows(start, end, department, search);
        break;
      case 'attendance':
      default:
        allRows = await buildAttendanceRows(start, end, department, status, search);
        break;
    }

    const totalCount = allRows.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const safePage = Math.min(page, totalPages);
    const records = allRows.slice((safePage - 1) * pageSize, safePage * pageSize);

    res.json({
      category,
      records,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      dateRangeLabel: label,
    });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Unable to generate report.' });
  }
});

export default router;
