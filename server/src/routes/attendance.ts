import { Router, Response } from 'express';
import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { runAbsentScan } from '../jobs/autoAbsent.js';

const router = Router();

const clockInSchema = z.object({
  employeeEmail: z.string().email(),
});

const clockOutSchema = z.object({
  employeeEmail: z.string().email(),
});

const teamAttendanceSchema = z.object({
  leadEmail: z.string().email(),
  date: z.string().optional(),
});

// POST /api/attendance/clock-in
router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (existing && existing.clockIn) {
      res.status(409).json({ error: 'Already clocked in today.', attendance: existing });
      return;
    }

    let attendance;
    if (existing) {
      existing.clockIn = timeStr;
      existing.clockInAt = now;
      existing.status = 'Present';
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        clockIn: timeStr,
        clockInAt: now,
        status: 'Present',
      });
    }

    res.json({ success: true, attendance: { id: attendance._id, clockIn: timeStr, clockInAt: attendance.clockInAt, status: 'Present' } });
  } catch (err) {
    console.error('Clock in error:', err);
    res.status(500).json({ error: 'Unable to clock in.' });
  }
});

// POST /api/attendance/clock-out
router.post('/clock-out', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockOutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (!attendance || !attendance.clockIn) {
      res.status(400).json({ error: 'No clock-in found for today.' });
      return;
    }

    if (attendance.clockOut) {
      res.status(409).json({ error: 'Already clocked out today.' });
      return;
    }

    // Auto-end active break before clocking out
    if (attendance.breakStartedAt) {
      const breakMs = new Date().getTime() - new Date(attendance.breakStartedAt).getTime();
      const breakMins = Math.max(1, Math.round(breakMs / 60000));
      attendance.breakMinutes = (attendance.breakMinutes || 0) + breakMins;
      attendance.breakStartedAt = null;
    }

    attendance.clockOut = timeStr;

    // Calculate working minutes
    const parseTime = (t: string) => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const clockInMin = parseTime(attendance.clockIn);
    const clockOutMin = parseTime(timeStr);
    let working = clockOutMin - clockInMin;
    if (working < 0) working += 24 * 60; // overnight shift
    working -= attendance.breakMinutes;
    if (working < 0) working = 0; // never negative
    attendance.workingMinutes = working;

    // Auto-assign status
    if (working >= 480) attendance.status = 'Present';
    else if (working >= 240) attendance.status = 'Half Day';
    else attendance.status = 'Short Hours';

    await attendance.save();

    res.json({
      success: true,
      attendance: {
        id: attendance._id,
        clockIn: attendance.clockIn,
        clockOut: timeStr,
        workingMinutes: working,
        breakMinutes: attendance.breakMinutes,
        status: attendance.status,
      },
    });
  } catch (err) {
    console.error('Clock out error:', err);
    res.status(500).json({ error: 'Unable to clock out.' });
  }
});

// POST /api/attendance/break-start — start break
router.post('/break-start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    if (!attendance || !attendance.clockIn) {
      res.status(400).json({ error: 'Clock in first before starting a break.' });
      return;
    }
    if (attendance.clockOut) {
      res.status(400).json({ error: 'Shift already completed.' });
      return;
    }
    if (attendance.breakStartedAt) {
      res.status(409).json({ error: 'Break already in progress.' });
      return;
    }

    attendance.breakStartedAt = new Date();
    await attendance.save();

    res.json({ success: true, breakStartedAt: attendance.breakStartedAt });
  } catch (err) {
    console.error('Break start error:', err);
    res.status(500).json({ error: 'Unable to start break.' });
  }
});

// POST /api/attendance/break-end — end break and accumulate minutes
router.post('/break-end', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    if (!attendance || !attendance.clockIn) {
      res.status(400).json({ error: 'No active shift found.' });
      return;
    }
    if (!attendance.breakStartedAt) {
      res.status(400).json({ error: 'No break in progress.' });
      return;
    }

    const breakMs = new Date().getTime() - new Date(attendance.breakStartedAt).getTime();
    const breakMins = Math.max(1, Math.round(breakMs / 60000));

    attendance.breakMinutes = (attendance.breakMinutes || 0) + breakMins;
    attendance.breakStartedAt = null;
    await attendance.save();

    res.json({ success: true, breakMinutes: attendance.breakMinutes, lastBreakMinutes: breakMins });
  } catch (err) {
    console.error('Break end error:', err);
    res.status(500).json({ error: 'Unable to end break.' });
  }
});

// GET /api/attendance/today/:email — get today's attendance for an employee
router.get('/today/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    res.json({
      attendance: attendance ? {
        id: attendance._id,
        clockIn: attendance.clockIn || null,
        clockInAt: attendance.clockInAt || null,
        clockOut: attendance.clockOut || null,
        breakMinutes: attendance.breakMinutes,
        breakStartedAt: attendance.breakStartedAt || null,
        workingMinutes: attendance.workingMinutes,
        status: attendance.status,
      } : null,
    });
  } catch (err) {
    console.error('Get today attendance error:', err);
    res.status(500).json({ error: 'Unable to load attendance.' });
  }
});

// GET /api/attendance/team/:leadEmail — get team attendance for a date
router.get('/team/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    const date = String(req.query.date || new Date().toISOString().split('T')[0]);

    const leadEmployee = leadParam.includes('@')
      ? await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true })
      : await Employee.findById(leadParam);

    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const teamMembers = await Employee.find({ reportedTo: leadEmployee._id, isActive: true });
    const teamIds = teamMembers.map((m) => m._id);

    const records = await Attendance.find({
      employeeId: { $in: teamIds },
      date,
    }).populate('employeeId', 'name empId department jobTitle');

    const allTeam = teamMembers.map((m) => {
      const record = records.find((r) => r.employeeId._id.toString() === m._id.toString());
      return {
        employeeId: m._id.toString(),
        employeeName: m.name,
        employeeCode: m.empId,
        department: m.department,
        jobTitle: m.jobTitle,
        date,
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null,
        breakMinutes: record?.breakMinutes || 0,
        workingMinutes: record?.workingMinutes || 0,
        status: record?.status || 'Absent',
      };
    });

    res.json({ date, team: allTeam });
  } catch (err) {
    console.error('Get team attendance error:', err);
    res.status(500).json({ error: 'Unable to load team attendance.' });
  }
});

// GET /api/attendance/history/:email — get attendance history for an employee
router.get('/history/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const days = parseInt(String(req.query.days) || '30', 10);
    const records = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(days);

    res.json({
      employee: { id: employee._id, name: employee.name, empId: employee.empId },
      records: records.map((r) => ({
        id: r._id,
        date: r.date,
        clockIn: r.clockIn || null,
        clockOut: r.clockOut || null,
        breakMinutes: r.breakMinutes,
        workingMinutes: r.workingMinutes,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Get attendance history error:', err);
    res.status(500).json({ error: 'Unable to load attendance history.' });
  }
});

/* ------------------------------------------------------------------ */
/* HR ATTENDANCE MANAGEMENT                                            */
/* ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STANDARD_SHIFT_MINUTES = 540; // 6 PM – 3 AM = 9 hours

const toISODate = (d: Date): string => {
  const yr = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
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
  const d = new Date(yr, mon - 1, day);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const minutesToHM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const parseClockToMinutes = (timeStr: string): number => {
  // "10:25 PM" → minutes since midnight
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ap = match[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const resolvePresetRange = (preset: string, startDate?: string, endDate?: string): { start: string; end: string; label: string } => {
  const today = toISODate(new Date());
  const [ty, tm, td] = today.split('-').map(Number);
  const dow = new Date(ty, tm - 1, td).getDay(); // 0 = Sun

  switch (preset) {
    case 'today':
      return { start: today, end: today, label: `Today — ${dateLabel(today)}` };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { start: y, end: y, label: `Yesterday — ${dateLabel(y)}` };
    }
    case 'this_week': {
      const monOffset = dow === 0 ? -6 : 1 - dow;
      const start = addDays(today, monOffset);
      const end = addDays(start, 6);
      return { start, end, label: `This Week — ${dateShort(start)} to ${dateShort(end)}` };
    }
    case 'last_week': {
      const monOffset = dow === 0 ? -6 : 1 - dow;
      const thisMon = addDays(today, monOffset);
      const start = addDays(thisMon, -7);
      const end = addDays(start, 6);
      return { start, end, label: `Last Week — ${dateShort(start)} to ${dateShort(end)}` };
    }
    case 'last_7_days': {
      const start = addDays(today, -6);
      return { start, end: today, label: `Last 7 Days — ${dateShort(start)} to ${dateShort(today)}` };
    }
    case 'this_month': {
      const start = `${ty}-${String(tm).padStart(2, '0')}-01`;
      return { start, end: today, label: `This Month — ${MONTHS[tm - 1]} ${ty}` };
    }
    case 'last_month': {
      const d = new Date(ty, tm - 2, 1);
      const start = toISODate(d);
      const [ly, lm] = start.split('-').map(Number);
      const lastDay = new Date(ly, lm, 0).getDate();
      const end = `${ly}-${String(lm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end, label: `Last Month — ${MONTHS[lm - 1]} ${ly}` };
    }
    case 'custom': {
      const s = startDate || today;
      const e = endDate || today;
      return { start: s, end: e, label: `${dateShort(s)} to ${dateShort(e)}` };
    }
    default:
      return { start: today, end: today, label: `Today — ${dateLabel(today)}` };
  }
};

const PRESENT_STATUSES = ['Present', 'Late', 'Short Hours', 'On Duty', 'Pending OT'];

// GET /api/attendance/hr — HR attendance management with filters, pagination & summaries
router.get('/hr', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.query;
    const preset = String(q.preset || 'today');
    const { start, end, label } = resolvePresetRange(preset, q.startDate as string, q.endDate as string);
    const department = String(q.department || 'ALL');
    const employeeId = String(q.employeeId || 'ALL');
    const status = String(q.status || 'ALL');
    const search = String(q.search || '').trim();
    const page = Math.max(1, parseInt(String(q.page || '1'), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(q.pageSize || '20'), 10)));

    // Resolve employee filter set (search + department)
    const empQuery: Record<string, unknown> = { isActive: true };
    if (department !== 'ALL') empQuery.department = department;
    if (employeeId !== 'ALL') empQuery._id = employeeId;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      empQuery.$or = [{ name: rx }, { empId: rx }, { email: rx }];
    }
    const matchedEmployees = await Employee.find(empQuery).select('_id name empId email department jobTitle');
    const empIds = matchedEmployees.map((e) => e._id);

    const attQuery: Record<string, unknown> = {
      date: { $gte: start, $lte: end },
      employeeId: { $in: empIds },
    };
    if (status !== 'ALL') {
      if (status === 'Late') attQuery.status = { $in: ['Late', 'Short Hours'] };
      else attQuery.status = status;
    }

    const totalCount = await Attendance.countDocuments(attQuery);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const [records, allMatching] = await Promise.all([
      Attendance.find(attQuery)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('employeeId', 'name empId email department jobTitle'),
      Attendance.find(attQuery), // for summaries
    ]);

    const empMap = new Map(matchedEmployees.map((e) => [String(e._id), e]));

    const mappedRecords = records.map((r) => {
      const emp = r.employeeId as unknown as { _id: { toString(): string }; name: string; empId: string; department: string; jobTitle: string } | null;
      const empDoc = empMap.get(String(r.employeeId._id || r.employeeId));
      const name = emp?.name || empDoc?.name || 'Unknown';
      const code = emp?.empId || empDoc?.empId || '—';
      const dept = (emp?.department || empDoc?.department || 'HR') as 'HR' | 'Sales' | 'Tech';

      const inMin = r.clockIn ? parseClockToMinutes(r.clockIn) : null;
      const outMin = r.clockOut ? parseClockToMinutes(r.clockOut) : null;
      const isOvernight = inMin !== null && outMin !== null && outMin <= inMin;

      const worked = r.workingMinutes || 0;
      const extra = worked > STANDARD_SHIFT_MINUTES ? worked - STANDARD_SHIFT_MINUTES : 0;
      const short = worked < STANDARD_SHIFT_MINUTES && PRESENT_STATUSES.includes(r.status) ? STANDARD_SHIFT_MINUTES - worked : 0;

      // Timeline (real events)
      const timeline: Array<{ id: string; time: string; date: string; type: string; label: string; notes?: string }> = [];
      if (r.clockIn) {
        timeline.push({ id: 'tl_in', time: r.clockIn, date: dateShort(r.date), type: 'CLOCK_IN', label: 'Shift Punch In', notes: 'Clocked in via dashboard' });
      }
      if (r.breakMinutes > 0) {
        timeline.push({ id: 'tl_break', time: '—', date: dateShort(r.date), type: 'PAUSE', label: 'Break Taken', notes: `Total break duration: ${minutesToHM(r.breakMinutes)}` });
      }
      if (r.clockOut) {
        timeline.push({ id: 'tl_out', time: r.clockOut, date: dateShort(isOvernight ? addDays(r.date, 1) : r.date), type: 'CLOCK_OUT', label: 'Shift Punch Out', notes: isOvernight ? 'Overnight shift — punched out after midnight' : 'Clocked out via dashboard' });
      }
      if (timeline.length === 0) {
        timeline.push({ id: 'tl_flag', time: '—', date: dateShort(r.date), type: 'SYSTEM_FLAG', label: `Status: ${r.status}`, notes: r.notes || `Recorded as ${r.status}` });
      }

      return {
        id: String(r._id),
        employeeId: String(r.employeeId._id || r.employeeId),
        employeeName: name,
        employeeCode: code,
        designation: empDoc?.jobTitle || '',
        department: dept,
        attendanceDate: dateLabel(r.date),
        clockInTime: r.clockIn || '—',
        clockInDate: dateShort(r.date),
        clockOutTime: r.clockOut || '—',
        clockOutDate: dateShort(isOvernight ? addDays(r.date, 1) : r.date),
        breakDuration: minutesToHM(r.breakMinutes || 0),
        workingHours: minutesToHM(worked),
        extraHours: minutesToHM(extra),
        shortHours: minutesToHM(short),
        status: r.status,
        notes: r.notes || '',
        isOvernight,
        timeline,
      };
    });

    // Summaries over ALL matching records
    let employeeSummary = null;
    let companySummary = null;

    if (employeeId !== 'ALL') {
      const empDoc = matchedEmployees[0];
      const myRecords = allMatching;
      const countBy = (statuses: string[]) => myRecords.filter((r) => statuses.includes(r.status)).length;
      const totalWorked = myRecords.reduce((a, r) => a + (r.workingMinutes || 0), 0);
      const totalShort = myRecords.reduce((a, r) => {
        const w = r.workingMinutes || 0;
        return a + (w < STANDARD_SHIFT_MINUTES && PRESENT_STATUSES.includes(r.status) ? STANDARD_SHIFT_MINUTES - w : 0);
      }, 0);
      const workedDays = myRecords.filter((r) => PRESENT_STATUSES.includes(r.status));

      employeeSummary = {
        employee: empDoc
          ? {
              id: String(empDoc._id),
              empId: empDoc.empId,
              name: empDoc.name,
              email: empDoc.email,
              department: empDoc.department as 'HR' | 'Sales' | 'Tech',
              jobTitle: empDoc.jobTitle,
              joinedDate: '',
              status: 'Active' as const,
            }
          : null,
        periodLabel: label,
        workingDays: myRecords.length,
        presentDays: countBy(PRESENT_STATUSES),
        absentDays: countBy(['Absent']),
        leaveDays: countBy(['Leave']),
        wfhDays: countBy(['Work From Home']),
        halfDays: countBy(['Half Day']),
        avgWorkingHours: workedDays.length ? minutesToHM(Math.round(totalWorked / workedDays.length)) : '00:00',
        totalShortHours: minutesToHM(totalShort),
        approvedExtraHours: '00:00',
        pendingExtraHours: '00:00',
      };
    } else {
      const countBy = (statuses: string[]) => allMatching.filter((r) => statuses.includes(r.status)).length;
      const workedRecords = allMatching.filter((r) => PRESENT_STATUSES.includes(r.status));
      const totalWorked = allMatching.reduce((a, r) => a + (r.workingMinutes || 0), 0);
      const totalShort = allMatching.reduce((a, r) => {
        const w = r.workingMinutes || 0;
        return a + (w < STANDARD_SHIFT_MINUTES && PRESENT_STATUSES.includes(r.status) ? STANDARD_SHIFT_MINUTES - w : 0);
      }, 0);
      const totalEmployees = await Employee.countDocuments({ isActive: true });

      companySummary = {
        periodLabel: label,
        totalRecords: allMatching.length,
        presentCount: countBy(PRESENT_STATUSES),
        absentCount: countBy(['Absent']),
        leaveCount: countBy(['Leave']),
        wfhCount: countBy(['Work From Home']),
        halfDayCount: countBy(['Half Day']),
        avgWorkingHours: workedRecords.length ? minutesToHM(Math.round(totalWorked / workedRecords.length)) : '00:00',
        totalShortHours: minutesToHM(totalShort),
        totalApprovedExtraHours: '00:00',
        attendanceRate: totalEmployees ? Math.round((countBy(PRESENT_STATUSES) / totalEmployees) * 100) : 0,
      };
    }

    res.json({
      records: mappedRecords,
      totalCount,
      page,
      pageSize,
      totalPages,
      employeeSummary,
      companySummary,
      dateRangeLabel: label,
    });
  } catch (err) {
    console.error('HR attendance error:', err);
    res.status(500).json({ error: 'Unable to load attendance data.' });
  }
});

// POST /api/attendance/run-absent-scan — manual auto-absent scan (HR only)
// Body (optional): { date: "YYYY-MM-DD" } — defaults to last completed shift
router.post('/run-absent-scan', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const explicitDate = req.body?.date ? String(req.body.date) : undefined;
    if (explicitDate && !/^\d{4}-\d{2}-\d{2}$/.test(explicitDate)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }
    const result = await runAbsentScan(explicitDate);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Absent scan error:', err);
    res.status(500).json({ error: 'Absent scan failed.' });
  }
});

export default router;
