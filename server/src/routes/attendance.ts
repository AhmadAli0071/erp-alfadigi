import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Attendance, BreakType } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { runAbsentScan } from '../jobs/autoAbsent.js';
import { getAttendanceConfig } from '../jobs/autoAbsent.js';
import { canAccessEmployee, isHr } from '../utils/access.js';
import { notifyEmails, createNotification } from '../services/notificationService.js';
import { ensureSettings } from '../utils/defaults.js';

const router = Router();

/** Notify lead (if any) + HR admins so team attendance boards stay live. */
const notifyAttendanceEvent = async (
  employee: { name: string; reportedTo?: unknown },
  title: string,
  message: string,
  relatedId: string,
): Promise<void> => {
  if (employee.reportedTo) {
    const lead = await Employee.findById(employee.reportedTo);
    if (lead) {
      await createNotification({ userEmail: lead.email, title, message, type: 'attendance', relatedId });
    }
  }
  const hrUsers = await User.find({ role: { $in: ['HR_ADMIN', 'SUPER_ADMIN'] }, isActive: true }).select('email');
  await notifyEmails(hrUsers.map((u) => u.email), { title, message, type: 'attendance', relatedId });
};

/**
 * Late check: is the given PKT clock-in time later than shiftStart + grace?
 * Times before the shift start are early/on-time; anything past the grace
 * window (including after-midnight hours of an overnight shift) is late.
 */
const isLateClockIn = async (now: Date): Promise<{ late: boolean; grace: number }> => {
  const cfg = await getAttendanceConfig();
  const nowPkt = new Date(now.getTime() + 5 * 60 * 60000); // PKT = UTC+5
  const nowMin = nowPkt.getUTCHours() * 60 + nowPkt.getUTCMinutes();
  const startMin = cfg.start.h * 60 + cfg.start.m;
  const elapsed = (nowMin - startMin + 1440) % 1440; // minutes since most recent shift start
  return { late: elapsed > cfg.graceMinutes, grace: cfg.graceMinutes };
};

const clockInSchema = z.object({
  employeeEmail: z.string().email(),
});

const breakStartSchema = z.object({
  employeeEmail: z.string().email(),
  breakType: z.enum(['LUNCH', 'NAMAZ', 'WASHROOM']),
  memberEmail: z.string().email().optional(),
});

const breakEndSchema = z.object({
  employeeEmail: z.string().email(),
  breakType: z.enum(['LUNCH', 'NAMAZ', 'WASHROOM']).optional(),
  memberEmail: z.string().email().optional(),
});

const BREAK_LABELS: Record<BreakType, string> = {
  LUNCH: 'Lunch',
  NAMAZ: 'Namaz',
  WASHROOM: 'Washroom',
};

const STANDARD_SHIFT_MINUTES = 540; // 6 PM – 3 AM = 9 hours (matches HR view extra-hours math)

const ATTENDANCE_STATUSES = [
  'Present',
  'Absent',
  'Late',
  'Half Day',
  'Leave',
  'Work From Home',
  'On Duty',
  'Pending OT',
  'Short Hours',
] as const;

/**
 * Normalizes a clock time coming from HR edit forms. Accepts "HH:MM" (24h)
 * or "hh:mm AM/PM" and returns the canonical "hh:mm AM/PM" display format
 * used across the app. Returns null for invalid input.
 */
const normalizeClockInput = (raw: string): string | null => {
  const s = raw.trim().toUpperCase();
  let m = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/.exec(s);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 1 || h > 12 || min > 59) return null;
    const ap = m[3];
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ap}`;
  }
  m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ap}`;
  }
  return null;
};

/** Daily break budgets (minutes) from SystemSettings with safe fallbacks. */
const getBreakBudgets = async (): Promise<{ lunch: number; namaz: number; washroom: number }> => {
  try {
    const s = await ensureSettings();
    const budgets = ((s.attendance as Record<string, unknown>) || {}).breakTypeBudgets as Record<string, unknown> | undefined;
    return {
      lunch: Number(budgets?.lunch) || 60,
      namaz: Number(budgets?.namaz) || 10,
      washroom: Number(budgets?.washroom) || 10,
    };
  } catch {
    return { lunch: 60, namaz: 10, washroom: 10 };
  }
};

/**
 * Resolve the logged-in user's Employee record: by matching email first,
 * then via the Employee.userId link (covers Lead/HR accounts whose User
 * email differs from their Employee email).
 */
const resolveEmployee = async (req: AuthRequest) => {
  const email = selfEmail(req);
  const byEmail = await Employee.findOne({ email, isActive: true });
  if (byEmail) return byEmail;
  const user = await User.findOne({ email, isActive: true });
  if (user) return Employee.findOne({ userId: user._id, isActive: true });
  return null;
};

/** Type-bucket key for an attendance doc. */
const typeKey = (t: BreakType): 'lunch' | 'namaz' | 'washroom' => t.toLowerCase() as 'lunch' | 'namaz' | 'washroom';

const clockOutSchema = z.object({
  employeeEmail: z.string().email(),
});

const teamAttendanceSchema = z.object({
  leadEmail: z.string().email(),
  date: z.string().optional(),
});

/** Identity always comes from the JWT - the client-supplied email is ignored. */
const selfEmail = (req: AuthRequest): string => req.user!.email.toLowerCase();

// POST /api/attendance/clock-in
router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

    const { late } = await isLateClockIn(now);
    const newStatus = late ? 'Late' : 'Present';

    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (existing && existing.clockIn) {
      res.status(409).json({ error: 'Already clocked in today.', attendance: existing });
      return;
    }

    let attendance;
    if (existing) {
      existing.clockIn = timeStr;
      existing.clockInAt = now;
      existing.status = newStatus;
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        clockIn: timeStr,
        clockInAt: now,
        status: newStatus,
      });
    }

    if (late) {
      await notifyAttendanceEvent(
        employee,
        'Late Arrival',
        `${employee.name} clocked in LATE at ${timeStr} (after grace period).`,
        String(attendance._id),
      );
    } else {
      await notifyAttendanceEvent(employee, 'Team Member Clocked In', `${employee.name} clocked in at ${timeStr}.`, String(attendance._id));
    }

    res.json({ success: true, attendance: { id: attendance._id, clockIn: timeStr, clockInAt: attendance.clockInAt, status: newStatus } });
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

    const employee = await resolveEmployee(req);
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
      if (attendance.breakType) {
        const key = typeKey(attendance.breakType);
        attendance.breakMinutesByType[key] = (attendance.breakMinutesByType?.[key] || 0) + breakMins;
      }
      attendance.breakStartedAt = null;
      attendance.breakType = null;
    }

    attendance.clockOut = timeStr;
    attendance.clockOutAt = new Date();

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

    // Auto-assign status (settings-driven, same thresholds as the auto clock-out sweep)
    const attCfg = await getAttendanceConfig();
    if (working >= attCfg.requiredWorkingHours * 60) attendance.status = 'Present';
    else if (working >= attCfg.requiredWorkingHours * 30) attendance.status = 'Half Day';
    else attendance.status = 'Short Hours';

    await attendance.save();

    await notifyAttendanceEvent(employee, 'Team Member Clocked Out', `${employee.name} clocked out at ${timeStr} (${attendance.status}).`, String(attendance._id));

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

// POST /api/attendance/break-start - start a typed break (LUNCH / NAMAZ / WASHROOM)
router.post('/break-start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = breakStartSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const breakType = parsed.data.breakType;

    // Lead/HR may act on a team member by passing memberEmail (access-checked).
    const memberEmail = parsed.data.memberEmail?.toLowerCase();
    let employee;
    if (memberEmail && memberEmail !== selfEmail(req)) {
      if (!(await canAccessEmployee(req, memberEmail))) {
        res.status(403).json({ error: 'You can only manage breaks for your own team members.' });
        return;
      }
      employee = await Employee.findOne({ email: memberEmail, isActive: true });
    } else {
      employee = await resolveEmployee(req);
    }
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

    // NAMAZ / WASHROOM: block when the daily budget is fully used.
    // LUNCH: always allowed - extra minutes are deducted from working hours.
    if (breakType !== 'LUNCH') {
      const budgets = await getBreakBudgets();
      const used = attendance.breakMinutesByType?.[typeKey(breakType)] || 0;
      if (used >= budgets[typeKey(breakType)]) {
        res.status(409).json({ error: `Daily ${BREAK_LABELS[breakType].toLowerCase()} break budget is used up.` });
        return;
      }
    }

    attendance.breakStartedAt = new Date();
    attendance.breakType = breakType;
    if (!attendance.breakMinutesByType) attendance.breakMinutesByType = { lunch: 0, namaz: 0, washroom: 0 };
    await attendance.save();

    await notifyAttendanceEvent(
      employee,
      'Team Member On Break',
      `${employee.name} went on ${BREAK_LABELS[breakType]} break at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`,
      String(attendance._id),
    );

    // When a lead/HR starts the break on the member's behalf, tell the member.
    if (memberEmail && memberEmail !== selfEmail(req)) {
      await createNotification({
        userEmail: employee.email,
        title: 'Break Started',
        message: `${req.user!.name} started your ${BREAK_LABELS[breakType]} break at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'attendance',
        relatedId: String(attendance._id),
      });
    }

    res.json({
      success: true,
      breakStartedAt: attendance.breakStartedAt,
      breakType: attendance.breakType,
      breakMinutesByType: attendance.breakMinutesByType,
    });
  } catch (err) {
    console.error('Break start error:', err);
    res.status(500).json({ error: 'Unable to start break.' });
  }
});

// POST /api/attendance/break-end - end the active break and accumulate minutes per type
router.post('/break-end', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = breakEndSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    // Lead/HR may end a team member's break by passing memberEmail (access-checked).
    const memberEmail = parsed.data.memberEmail?.toLowerCase();
    let employee;
    if (memberEmail && memberEmail !== selfEmail(req)) {
      if (!(await canAccessEmployee(req, memberEmail))) {
        res.status(403).json({ error: 'You can only manage breaks for your own team members.' });
        return;
      }
      employee = await Employee.findOne({ email: memberEmail, isActive: true });
    } else {
      employee = await resolveEmployee(req);
    }
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
    const breakType: BreakType = attendance.breakType || 'LUNCH';

    if (!attendance.breakMinutesByType) attendance.breakMinutesByType = { lunch: 0, namaz: 0, washroom: 0 };
    const key = typeKey(breakType);
    attendance.breakMinutesByType[key] = (attendance.breakMinutesByType[key] || 0) + breakMins;
    attendance.breakMinutes = (attendance.breakMinutes || 0) + breakMins;
    attendance.breakStartedAt = null;
    attendance.breakType = null;
    await attendance.save();

    // Over-limit flag: minutes beyond the daily budget for this type
    const budgets = await getBreakBudgets();
    const overLimit = attendance.breakMinutesByType[key] > budgets[key];

    // When a lead/HR ends the member's break, tell the member.
    if (memberEmail && memberEmail !== selfEmail(req)) {
      await createNotification({
        userEmail: employee.email,
        title: 'Break Ended',
        message: `${req.user!.name} ended your ${BREAK_LABELS[breakType]} break (${breakMins} min). Time to resume work.`,
        type: 'attendance',
        relatedId: String(attendance._id),
      });
    }

    res.json({
      success: true,
      breakMinutes: attendance.breakMinutes,
      breakMinutesByType: attendance.breakMinutesByType,
      lastBreakType: breakType,
      lastBreakMinutes: breakMins,
      overLimit,
    });
  } catch (err) {
    console.error('Break end error:', err);
    res.status(500).json({ error: 'Unable to end break.' });
  }
});

// GET /api/attendance/today/:email - get today's attendance for an employee
router.get('/today/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    const breakBudgets = await getBreakBudgets();

    res.json({
      breakBudgets,
      attendance: attendance ? {
        id: attendance._id,
        clockIn: attendance.clockIn || null,
        clockInAt: attendance.clockInAt || null,
        clockOut: attendance.clockOut || null,
        breakMinutes: attendance.breakMinutes,
        breakStartedAt: attendance.breakStartedAt || null,
        breakType: attendance.breakType || null,
        breakMinutesByType: attendance.breakMinutesByType || { lunch: 0, namaz: 0, washroom: 0 },
        workingMinutes: attendance.workingMinutes,
        status: attendance.status,
      } : null,
    });
  } catch (err) {
    console.error('Get today attendance error:', err);
    res.status(500).json({ error: 'Unable to load attendance.' });
  }
});

// GET /api/attendance/team/:leadEmail - get team attendance for a date
router.get('/team/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    if (!isHr(req) && leadParam.toLowerCase() !== selfEmail(req)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    const date = String(req.query.date || new Date().toISOString().split('T')[0]);
    const startDateParam = String(req.query.startDate || '');
    const endDateParam = String(req.query.endDate || '');

    const leadEmployee = leadParam.includes('@')
      ? await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true })
      : await Employee.findById(leadParam);

    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const teamMembers = await Employee.find({ reportedTo: leadEmployee._id, isActive: true });
    const teamIds = teamMembers.map((m) => m._id);

    // Optional date-range mode (e.g. last 7 / 30 days)
    if (startDateParam && endDateParam) {
      const rangeRecords = await Attendance.find({
        employeeId: { $in: teamIds },
        date: { $gte: startDateParam, $lte: endDateParam },
      })
        .sort({ date: -1 })
        .populate('employeeId', 'name empId email department jobTitle');

      const teamInfo = new Map(teamMembers.map((m) => [String(m._id), m]));

      res.json({
        range: { start: startDateParam, end: endDateParam },
        records: rangeRecords.map((r) => {
          const emp = r.employeeId as unknown as { _id: { toString(): string }; name: string; empId: string; email: string; department: string; jobTitle: string } | null;
          const info = emp ? teamInfo.get(String(emp._id)) : undefined;
          return {
            employeeId: String(r.employeeId._id || r.employeeId),
            employeeName: emp?.name || info?.name || 'Unknown',
            employeeCode: emp?.empId || info?.empId || '-',
            employeeEmail: emp?.email || info?.email || '',
            department: emp?.department || info?.department || '',
            jobTitle: emp?.jobTitle || info?.jobTitle || '',
            date: r.date,
            clockIn: r.clockIn || null,
            clockOut: r.clockOut || null,
            breakMinutes: r.breakMinutes || 0,
            workingMinutes: r.workingMinutes || 0,
            status: r.status,
            onBreak: !!r.breakStartedAt,
            breakStartedAt: r.breakStartedAt || null,
            breakType: r.breakType || null,
            breakMinutesByType: r.breakMinutesByType || { lunch: 0, namaz: 0, washroom: 0 },
          };
        }),
      });
      return;
    }

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
        employeeEmail: m.email,
        department: m.department,
        jobTitle: m.jobTitle,
        date,
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null,
        breakMinutes: record?.breakMinutes || 0,
        workingMinutes: record?.workingMinutes || 0,
        status: record?.status || 'Absent',
        onBreak: !!record?.breakStartedAt,
        breakStartedAt: record?.breakStartedAt || null,
        breakType: record?.breakType || null,
        breakMinutesByType: record?.breakMinutesByType || { lunch: 0, namaz: 0, washroom: 0 },
      };
    });

    res.json({ date, team: allTeam });
  } catch (err) {
    console.error('Get team attendance error:', err);
    res.status(500).json({ error: 'Unable to load team attendance.' });
  }
});

// GET /api/attendance/history/:email - get attendance history for an employee
router.get('/history/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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

    const days = Math.min(Math.max(parseInt(String(req.query.days) || '30', 10) || 30, 1), 365);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startStr = start.toISOString().split('T')[0];

    const records = await Attendance.find({ employeeId: employee._id, date: { $gte: startStr } })
      .sort({ date: -1 });

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
        correctionStatus: r.correctionStatus || 'NONE',
        correctionReason: r.correctionReason || '',
        correctionNote: r.correctionNote || '',
        otStatus: r.otStatus || 'NONE',
        otReason: r.otReason || '',
        otNote: r.otNote || '',
        otApprovedMinutes: r.otApprovedMinutes || 0,
      })),
    });
  } catch (err) {
    console.error('Get attendance history error:', err);
    res.status(500).json({ error: 'Unable to load attendance history.' });
  }
});

/* ------------------------------------------------------------------ */
/* CORRECTION & OVERTIME REQUESTS (employee/lead initiated)            */
/* ------------------------------------------------------------------ */

const reviewRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters.').max(300),
});

/** Loads the attendance record + owning employee, enforcing self/lead/HR access. */
const loadAttendanceForReviewAction = async (req: AuthRequest, id: string) => {
  if (!mongoose.isValidObjectId(id)) return { error: 'not_found' as const };
  const attendance = await Attendance.findById(id);
  if (!attendance) return { error: 'not_found' as const };
  const employee = await Employee.findById(attendance.employeeId);
  if (!employee) return { error: 'not_found' as const };
  const isSelf = employee.email.toLowerCase() === selfEmail(req);
  if (!isSelf && !isHr(req) && !(await canAccessEmployee(req, employee.email))) {
    return { error: 'forbidden' as const };
  }
  return { attendance, employee };
};

// POST /api/attendance/:id/correction-request - employee asks HR to fix this day's record
router.post('/:id/correction-request', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = reviewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const loaded = await loadAttendanceForReviewAction(req, String(req.params.id));
    if (loaded.error === 'not_found') {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }
    if (loaded.error === 'forbidden') {
      res.status(403).json({ error: 'You can only request corrections for your own attendance.' });
      return;
    }

    const { attendance, employee } = loaded;
    if (attendance.correctionStatus === 'PENDING') {
      res.status(409).json({ error: 'A correction request is already pending for this day.' });
      return;
    }

    attendance.correctionStatus = 'PENDING';
    attendance.correctionReason = parsed.data.reason;
    attendance.correctionNote = '';
    await attendance.save();

    await notifyAttendanceEvent(
      employee,
      'Attendance Correction Request',
      `${employee.name} requested a correction for ${attendance.date}: "${parsed.data.reason}"`,
      String(attendance._id),
    );

    res.json({ success: true, correctionStatus: attendance.correctionStatus });
  } catch (err) {
    console.error('Correction request error:', err);
    res.status(500).json({ error: 'Unable to submit correction request.' });
  }
});

// POST /api/attendance/:id/ot-request - employee asks HR to approve extra hours for this day
router.post('/:id/ot-request', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = reviewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const loaded = await loadAttendanceForReviewAction(req, String(req.params.id));
    if (loaded.error === 'not_found') {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }
    if (loaded.error === 'forbidden') {
      res.status(403).json({ error: 'You can only request overtime approval for your own attendance.' });
      return;
    }

    const { attendance, employee } = loaded;
    if (!attendance.clockIn) {
      res.status(400).json({ error: 'Overtime cannot be requested for a day without a clock-in.' });
      return;
    }
    if (attendance.otStatus === 'PENDING') {
      res.status(409).json({ error: 'An overtime request is already pending for this day.' });
      return;
    }

    attendance.otStatus = 'PENDING';
    attendance.otReason = parsed.data.reason;
    attendance.otNote = '';
    attendance.status = 'Pending OT';
    await attendance.save();

    const extraMinutes = Math.max(0, (attendance.workingMinutes || 0) - STANDARD_SHIFT_MINUTES);
    await notifyAttendanceEvent(
      employee,
      'Overtime Approval Request',
      `${employee.name} requested OT approval for ${attendance.date} (${Math.floor(extraMinutes / 60)}h ${extraMinutes % 60}m extra): "${parsed.data.reason}"`,
      String(attendance._id),
    );

    res.json({ success: true, otStatus: attendance.otStatus, status: attendance.status });
  } catch (err) {
    console.error('OT request error:', err);
    res.status(500).json({ error: 'Unable to submit overtime request.' });
  }
});

/* ------------------------------------------------------------------ */
/* HR ATTENDANCE MANAGEMENT                                            */
/* ------------------------------------------------------------------ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const d = new Date(Date.UTC(yr, mon - 1, day + days));
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
      const end = addDays(start, 6);
      return { start, end, label: `This Week, ${dateShort(start)} to ${dateShort(end)}` };
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
    case 'custom': {
      const s = startDate || today;
      const e = endDate || today;
      return { start: s, end: e, label: `${dateShort(s)} to ${dateShort(e)}` };
    }
    default:
      return { start: today, end: today, label: `Today, ${dateLabel(today)}` };
  }
};

const PRESENT_STATUSES = ['Present', 'Late', 'Short Hours', 'On Duty', 'Pending OT'];

// GET /api/attendance/hr - HR attendance management with filters, pagination & summaries (HR only)
router.get('/hr', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
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
      const code = emp?.empId || empDoc?.empId || '-';
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
        const byType = r.breakMinutesByType;
        const parts: string[] = [];
        if (byType && byType.lunch > 0) parts.push(`Lunch ${minutesToHM(byType.lunch)}`);
        if (byType && byType.namaz > 0) parts.push(`Namaz ${minutesToHM(byType.namaz)}`);
        if (byType && byType.washroom > 0) parts.push(`Washroom ${minutesToHM(byType.washroom)}`);
        timeline.push({ id: 'tl_break', time: '-', date: dateShort(r.date), type: 'PAUSE', label: 'Break Taken', notes: parts.length ? parts.join(' · ') : `Total break duration: ${minutesToHM(r.breakMinutes)}` });
      }
      if (r.clockOut) {
        timeline.push({ id: 'tl_out', time: r.clockOut, date: dateShort(isOvernight ? addDays(r.date, 1) : r.date), type: 'CLOCK_OUT', label: 'Shift Punch Out', notes: isOvernight ? 'Overnight shift - punched out after midnight' : 'Clocked out via dashboard' });
      }
      if (timeline.length === 0) {
        timeline.push({ id: 'tl_flag', time: '-', date: dateShort(r.date), type: 'SYSTEM_FLAG', label: `Status: ${r.status}`, notes: r.notes || `Recorded as ${r.status}` });
      }

      return {
        id: String(r._id),
        employeeId: String(r.employeeId._id || r.employeeId),
        employeeName: name,
        employeeCode: code,
        designation: empDoc?.jobTitle || '',
        department: dept,
        attendanceDate: dateLabel(r.date),
        clockInTime: r.clockIn || '-',
        clockInDate: dateShort(r.date),
        clockOutTime: r.clockOut || '-',
        clockOutDate: dateShort(isOvernight ? addDays(r.date, 1) : r.date),
        breakDuration: minutesToHM(r.breakMinutes || 0),
        breakMinutesByType: r.breakMinutesByType || { lunch: 0, namaz: 0, washroom: 0 },
        workingHours: minutesToHM(worked),
        extraHours: minutesToHM(extra),
        shortHours: minutesToHM(short),
        status: r.status,
        notes: r.notes || '',
        isOvernight,
        correctionStatus: r.correctionStatus || 'NONE',
        correctionReason: r.correctionReason || '',
        correctionNote: r.correctionNote || '',
        otStatus: r.otStatus || 'NONE',
        otReason: r.otReason || '',
        otNote: r.otNote || '',
        otApprovedMinutes: r.otApprovedMinutes || 0,
        extraMinutes: extra,
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
      const [sy, sm, sd] = start.split('-').map(Number);
      const [ey, em, ed] = end.split('-').map(Number);
      const rangeDays = Math.max(1, Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000) + 1);
      const expectedRecords = totalEmployees * rangeDays;

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
        attendanceRate: expectedRecords ? Math.min(100, Math.round((countBy(PRESENT_STATUSES) / expectedRecords) * 100)) : 0,
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

/* ------------------------------------------------------------------ */
/* HR REVIEW - STATUS EDITOR, CORRECTIONS & OVERTIME DECISIONS         */
/* ------------------------------------------------------------------ */

const hrUpdateSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  notes: z.string().max(500).optional(),
  clockIn: z.string().max(12).nullable().optional(),
  clockOut: z.string().max(12).nullable().optional(),
});

const reviewDecisionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
});

// GET /api/attendance/hr/pending-review - pending correction/OT queues (HR only)
router.get('/hr/pending-review', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [pendingCorrections, pendingOT] = await Promise.all([
      Attendance.find({ correctionStatus: 'PENDING' })
        .sort({ updatedAt: -1 })
        .populate('employeeId', 'name empId email department'),
      Attendance.find({ otStatus: 'PENDING' })
        .sort({ updatedAt: -1 })
        .populate('employeeId', 'name empId email department'),
    ]);

    const mapItem = (r: typeof pendingCorrections[number]) => {
      const emp = r.employeeId as unknown as { _id: { toString(): string }; name: string; empId: string; department: string } | null;
      const working = r.workingMinutes || 0;
      return {
        id: String(r._id),
        employeeId: String(r.employeeId._id || r.employeeId),
        employeeName: emp?.name || 'Unknown',
        employeeCode: emp?.empId || '-',
        department: (emp?.department || 'HR') as 'HR' | 'Sales' | 'Tech',
        date: r.date,
        dateLabel: dateLabel(r.date),
        clockIn: r.clockIn || null,
        clockOut: r.clockOut || null,
        workingMinutes: working,
        extraMinutes: Math.max(0, working - STANDARD_SHIFT_MINUTES),
        status: r.status,
        reason: r.correctionReason || r.otReason || '',
        submittedAt: r.updatedAt,
      };
    };

    res.json({
      corrections: {
        count: pendingCorrections.length,
        items: pendingCorrections.map(mapItem),
      },
      overtime: {
        count: pendingOT.length,
        totalMinutes: pendingOT.reduce((a, r) => a + Math.max(0, (r.workingMinutes || 0) - STANDARD_SHIFT_MINUTES), 0),
        employees: new Set(pendingOT.map((r) => String(r.employeeId._id || r.employeeId))).size,
        items: pendingOT.map(mapItem),
      },
    });
  } catch (err) {
    console.error('Pending review error:', err);
    res.status(500).json({ error: 'Unable to load pending reviews.' });
  }
});

// PUT /api/attendance/hr/:id - HR manual edit: status (WFH / On Duty / Pending OT / ...), times, notes
router.put('/hr/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = hrUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { status, notes, clockIn, clockOut } = parsed.data;
    if (!status && notes === undefined && clockIn === undefined && clockOut === undefined) {
      res.status(400).json({ error: 'Nothing to update.' });
      return;
    }

    const attendance = await Attendance.findById(String(req.params.id));
    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }

    let timesChanged = false;
    if (clockIn !== undefined) {
      if (clockIn === null) {
        attendance.clockIn = undefined;
        attendance.clockInAt = null;
      } else {
        const normalized = normalizeClockInput(clockIn);
        if (!normalized) {
          res.status(400).json({ error: 'Invalid clock-in time. Use HH:MM (24h) or hh:mm AM/PM.' });
          return;
        }
        attendance.clockIn = normalized;
        if (!attendance.clockInAt) attendance.clockInAt = new Date();
      }
      timesChanged = true;
    }
    if (clockOut !== undefined) {
      if (clockOut === null) {
        attendance.clockOut = undefined;
        attendance.clockOutAt = null;
      } else {
        const normalized = normalizeClockInput(clockOut);
        if (!normalized) {
          res.status(400).json({ error: 'Invalid clock-out time. Use HH:MM (24h) or hh:mm AM/PM.' });
          return;
        }
        attendance.clockOut = normalized;
        if (!attendance.clockOutAt) attendance.clockOutAt = new Date();
      }
      timesChanged = true;
    }

    if (timesChanged) {
      if (attendance.clockIn && attendance.clockOut) {
        const inMin = parseClockToMinutes(attendance.clockIn);
        const outMin = parseClockToMinutes(attendance.clockOut);
        let working = outMin - inMin;
        if (working < 0) working += 24 * 60; // overnight shift
        working -= attendance.breakMinutes || 0;
        attendance.workingMinutes = Math.max(0, working);
      } else if (!attendance.clockIn) {
        attendance.workingMinutes = 0;
      }
    }

    if (notes !== undefined) attendance.notes = notes;

    if (status) {
      attendance.status = status;
      attendance.isAutoMarked = false;
    } else if (timesChanged && attendance.clockIn && attendance.clockOut) {
      // Status not explicitly chosen - recompute from edited hours (settings-driven thresholds)
      const cfg = await getAttendanceConfig();
      if (attendance.workingMinutes >= cfg.requiredWorkingHours * 60) attendance.status = 'Present';
      else if (attendance.workingMinutes >= cfg.requiredWorkingHours * 30) attendance.status = 'Half Day';
      else attendance.status = 'Short Hours';
    }

    // Editing the record resolves any pending correction request
    let resolvedCorrection = false;
    if (attendance.correctionStatus === 'PENDING') {
      attendance.correctionStatus = 'APPROVED';
      attendance.correctionNote = `Resolved via HR edit by ${req.user!.name}.`;
      resolvedCorrection = true;
    }

    await attendance.save();

    const employee = await Employee.findById(attendance.employeeId).select('name email');
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: 'Attendance Updated by HR',
        message: `Your attendance for ${attendance.date} was updated by ${req.user!.name}. Status: ${attendance.status}.${attendance.notes ? ` Note: ${attendance.notes}` : ''}`,
        type: 'attendance',
        relatedId: String(attendance._id),
      });
    }

    res.json({
      success: true,
      resolvedCorrection,
      attendance: {
        id: attendance._id,
        date: attendance.date,
        clockIn: attendance.clockIn || null,
        clockOut: attendance.clockOut || null,
        workingMinutes: attendance.workingMinutes,
        status: attendance.status,
        notes: attendance.notes || '',
        correctionStatus: attendance.correctionStatus,
      },
    });
  } catch (err) {
    console.error('HR attendance update error:', err);
    res.status(500).json({ error: 'Unable to update attendance record.' });
  }
});

// PUT /api/attendance/hr/:id/correction - approve/reject a pending correction request (HR only)
router.put('/hr/:id/correction', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = reviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    if (parsed.data.action === 'REJECTED' && !parsed.data.note?.trim()) {
      res.status(400).json({ error: 'A rejection reason is required.' });
      return;
    }

    const attendance = await Attendance.findById(String(req.params.id));
    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }
    if (attendance.correctionStatus !== 'PENDING') {
      res.status(409).json({ error: 'No pending correction request for this record.' });
      return;
    }

    attendance.correctionStatus = parsed.data.action;
    attendance.correctionNote = parsed.data.note?.trim() || '';
    await attendance.save();

    const employee = await Employee.findById(attendance.employeeId).select('email');
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: `Correction ${parsed.data.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your attendance correction for ${attendance.date} was ${parsed.data.action.toLowerCase()} by ${req.user!.name}.${attendance.correctionNote ? ` Note: ${attendance.correctionNote}` : ''}`,
        type: 'attendance',
        relatedId: String(attendance._id),
      });
    }

    res.json({ success: true, correctionStatus: attendance.correctionStatus, correctionNote: attendance.correctionNote });
  } catch (err) {
    console.error('Correction decision error:', err);
    res.status(500).json({ error: 'Unable to process correction request.' });
  }
});

// PUT /api/attendance/hr/:id/ot - approve/reject a pending overtime request (HR only)
router.put('/hr/:id/ot', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = reviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    if (parsed.data.action === 'REJECTED' && !parsed.data.note?.trim()) {
      res.status(400).json({ error: 'A rejection reason is required.' });
      return;
    }

    const attendance = await Attendance.findById(String(req.params.id));
    if (!attendance) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }
    if (attendance.otStatus !== 'PENDING') {
      res.status(409).json({ error: 'No pending overtime request for this record.' });
      return;
    }

    const extraMinutes = Math.max(0, (attendance.workingMinutes || 0) - STANDARD_SHIFT_MINUTES);
    attendance.otStatus = parsed.data.action;
    attendance.otNote = parsed.data.note?.trim() || '';
    if (parsed.data.action === 'APPROVED') {
      attendance.otApprovedMinutes = extraMinutes;
    }
    // 'Pending OT' is a request flag - restore a real attendance status on decision
    if (attendance.status === 'Pending OT') {
      attendance.status = attendance.clockIn ? 'Present' : 'Absent';
    }
    await attendance.save();

    const employee = await Employee.findById(attendance.employeeId).select('email');
    if (employee) {
      await createNotification({
        userEmail: employee.email,
        title: `Overtime ${parsed.data.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: parsed.data.action === 'APPROVED'
          ? `Your overtime for ${attendance.date} (${Math.floor(extraMinutes / 60)}h ${extraMinutes % 60}m) was approved by ${req.user!.name}.${attendance.otNote ? ` Note: ${attendance.otNote}` : ''}`
          : `Your overtime request for ${attendance.date} was rejected by ${req.user!.name}.${attendance.otNote ? ` Reason: ${attendance.otNote}` : ''}`,
        type: 'attendance',
        relatedId: String(attendance._id),
      });
    }

    res.json({
      success: true,
      otStatus: attendance.otStatus,
      otApprovedMinutes: attendance.otApprovedMinutes,
      status: attendance.status,
    });
  } catch (err) {
    console.error('OT decision error:', err);
    res.status(500).json({ error: 'Unable to process overtime request.' });
  }
});

// POST /api/attendance/run-absent-scan - manual auto-absent scan (HR only)
// Body (optional): { date: "YYYY-MM-DD" } - defaults to last completed shift
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
