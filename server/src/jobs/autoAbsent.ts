import cron from 'node-cron';
import { Employee } from '../models/Employee.js';
import { Attendance, IAttendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { notifyEmails } from '../services/notificationService.js';
import { ensureSettings } from '../utils/defaults.js';

/**
 * SHIFT: 6 PM – 3 AM (PKT, overnight) by default — configurable via
 * SystemSettings → attendance (shiftStart, shiftEnd, requiredWorkingHours,
 * gracePeriodMinutes). All job timing is derived from those settings.
 *
 * The auto-absent job runs daily at 22:05 UTC (3:05 AM PKT) — right after the
 * shift for the current UTC date has ended. Every active employee without an
 * attendance record for that date is marked Absent (or Leave if they had an
 * approved leave covering that date).
 *
 * The attendance sweep runs every 5 minutes and:
 *  - Auto clock-outs records whose shift has ended without a manual clock-out
 *    (working minutes are computed from clock-in up to shift end, minus breaks)
 *  - Flips employees back from 'On Leave' to 'Active' once their approved
 *    leave range has passed.
 */

export interface AbsentScanResult {
  date: string;
  scannedEmployees: number;
  markedAbsent: number;
  markedLeave: number;
}

export interface SweepResult {
  autoClockedOut: number;
  backToActive: number;
}

const PKT_OFFSET_MIN = 5 * 60; // PKT = UTC+5 (no DST)
const MS_DAY = 24 * 60 * 60 * 1000;

const utcDateFor = (d: Date): string => d.toISOString().split('T')[0];
const pktDateFor = (d: Date): string => new Date(d.getTime() + PKT_OFFSET_MIN * 60000).toISOString().split('T')[0];

/** Parses "06:00 PM" / "18:00" style strings into { h, m }. */
export const parseShiftTime = (t: string): { h: number; m: number } => {
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec((t || '').trim());
  if (!match) return { h: 18, m: 0 };
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ap = match[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (Number.isNaN(h) || h < 0 || h > 23 || Number.isNaN(m)) return { h: 18, m: 0 };
  return { h, m };
};

/** Formats { h, m } (24h) into "03:00 AM" style display string. */
const formatShiftTime = (h: number, m: number): string => {
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
};

export interface AttendanceConfig {
  start: { h: number; m: number };
  end: { h: number; m: number };
  requiredWorkingHours: number;
  graceMinutes: number;
}

/** Shift times from SystemSettings (PKT), with safe fallbacks. */
export const getAttendanceConfig = async (): Promise<AttendanceConfig> => {
  try {
    const s = await ensureSettings();
    const att = (s.attendance || {}) as Record<string, unknown>;
    return {
      start: parseShiftTime(String(att.shiftStart || '06:00 PM')),
      end: parseShiftTime(String(att.shiftEnd || '03:00 AM')),
      requiredWorkingHours: Number(att.requiredWorkingHours) || 8,
      graceMinutes: Number(att.gracePeriodMinutes) || 10,
    };
  } catch {
    return {
      start: { h: 18, m: 0 },
      end: { h: 3, m: 0 },
      requiredWorkingHours: 8,
      graceMinutes: 10,
    };
  }
};

/** Converts PKT minutes-of-day to UTC minutes-of-day (PKT = UTC+5). */
const pktToUtcMinutes = (pktH: number, pktM: number): { h: number; m: number } => {
  const total = ((pktH * 60 + pktM - PKT_OFFSET_MIN) % 1440 + 1440) % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
};

/**
 * The UTC datetime at which the shift that STARTED on the given UTC record
 * date ends (including any same-day/next-day wrap in UTC terms).
 */
const shiftEndUtcFor = (recordDate: string, cfg: AttendanceConfig): Date => {
  const startUtc = pktToUtcMinutes(cfg.start.h, cfg.start.m);
  const endUtc = pktToUtcMinutes(cfg.end.h, cfg.end.m);
  const base = new Date(`${recordDate}T00:00:00Z`);
  const start = new Date(base);
  start.setUTCHours(startUtc.h, startUtc.m, 0, 0);
  const end = new Date(base);
  end.setUTCHours(endUtc.h, endUtc.m, 0, 0);
  if (end <= start) end.setTime(end.getTime() + MS_DAY);
  return end;
};

const statusForWorkingMinutes = (working: number, requiredHours: number): IAttendance['status'] => {
  if (working >= requiredHours * 60) return 'Present';
  if (working >= requiredHours * 30) return 'Half Day';
  return 'Short Hours';
};

/**
 * Auto clock-out sweep + On Leave → Active sync. Runs every 5 minutes.
 */
export const runAttendanceSweep = async (): Promise<SweepResult> => {
  const cfg = await getAttendanceConfig();
  const now = new Date();
  let autoClockedOut = 0;
  let backToActive = 0;

  // 1) Auto clock-out: open-ended records whose shift has fully ended (+ grace)
  const openRecords = await Attendance.find({
    clockIn: { $exists: true, $ne: '' },
    $or: [{ clockOut: { $exists: false } }, { clockOut: '' }, { clockOut: null }],
  });

  for (const rec of openRecords) {
    const shiftEnd = shiftEndUtcFor(utcDateFor(new Date(rec.clockInAt || rec.date)), cfg);
    if (now.getTime() < shiftEnd.getTime() + cfg.graceMinutes * 60000) continue;

    const clockInAt = rec.clockInAt ? new Date(rec.clockInAt) : null;
    let working = clockInAt
      ? Math.round((shiftEnd.getTime() - clockInAt.getTime()) / 60000)
      : 0;
    working -= rec.breakMinutes || 0;
    if (working < 0) working = 0;

    const endUtc = pktToUtcMinutes(cfg.end.h, cfg.end.m);
    rec.clockOut = formatShiftTime(cfg.end.h, cfg.end.m);
    rec.clockOutAt = shiftEnd;
    rec.workingMinutes = working;
    rec.status = statusForWorkingMinutes(working, cfg.requiredWorkingHours);
    rec.notes = `${rec.notes ? `${rec.notes} | ` : ''}Auto clock-out at shift end (${formatShiftTime(endUtc.h, endUtc.m)} UTC scheduled)`;
    await rec.save();
    autoClockedOut++;

    const emp = await Employee.findById(rec.employeeId).select('email');
    if (emp) {
      await notifyEmails([emp.email], {
        title: 'Auto Clock-Out',
        message: `You missed clock-out on ${rec.date} — system auto clocked you out at ${rec.clockOut} (PKT). Working hours: ${Math.floor(working / 60)}h ${working % 60}m.`,
        type: 'attendance',
      });
    }
  }

  // 2) 'On Leave' → 'Active' once no approved leave covers today (PKT)
  const todayPkt = pktDateFor(now);
  const onLeave = await Employee.find({ status: 'On Leave', isActive: true }).select('name');
  for (const emp of onLeave) {
    const activeLeave = await Leave.findOne({
      employeeId: emp._id,
      status: { $in: ['Approved', 'Final Approved'] },
      startDate: { $lte: todayPkt },
      endDate: { $gte: todayPkt },
    });
    if (!activeLeave) {
      emp.status = 'Active';
      await emp.save();
      backToActive++;
    }
  }

  return { autoClockedOut, backToActive };
};

export const runAbsentScan = async (explicitDate?: string): Promise<AbsentScanResult> => {
  // Default: last COMPLETED shift (yesterday's UTC date) for manual runs.
  const date = explicitDate || utcDateFor(new Date(Date.now() - MS_DAY));

  const employees = await Employee.find({ isActive: true });
  const existing = await Attendance.find({ date }).select('employeeId');
  const haveRecord = new Set(existing.map((r) => String(r.employeeId)));

  const missing = employees.filter((e) => !haveRecord.has(String(e._id)));

  let markedAbsent = 0;
  let markedLeave = 0;

  for (const emp of missing) {
    const approvedLeave = await Leave.findOne({
      employeeId: emp._id,
      status: { $in: ['Approved', 'Final Approved'] },
      startDate: { $lte: date },
      endDate: { $gte: date },
    });

    await Attendance.create({
      employeeId: emp._id,
      date,
      status: approvedLeave ? 'Leave' : 'Absent',
      isAutoMarked: true,
      notes: approvedLeave
        ? `Auto-marked: on approved ${approvedLeave.leaveType} leave`
        : 'Auto-marked: no clock-in recorded',
    });

    if (approvedLeave) {
      markedLeave++;
    } else {
      markedAbsent++;
      await notifyEmails([emp.email], {
        title: 'Marked Absent',
        message: `You were marked Absent for ${date} — no clock-in was recorded. Contact HR if this is incorrect.`,
        type: 'attendance',
      });
    }
  }

  return { date, scannedEmployees: employees.length, markedAbsent, markedLeave };
};

export const startAutoAbsentJob = (): void => {
  // 22:05 UTC = 3:05 AM PKT — daily, right after the 6 PM – 3 AM shift ends.
  cron.schedule('5 22 * * *', async () => {
    try {
      const result = await runAbsentScan(utcDateFor(new Date()));
      console.log(
        `[autoAbsent] ${result.date}: scanned ${result.scannedEmployees}, marked ${result.markedAbsent} absent, ${result.markedLeave} leave`
      );
    } catch (err) {
      console.error('[autoAbsent] Scan failed:', err);
    }
  }, { timezone: 'UTC' });
  console.log('[autoAbsent] Scheduled daily at 22:05 UTC (3:05 AM PKT)');

  // Sweep every 5 minutes: auto clock-out + On Leave → Active sync
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await runAttendanceSweep();
      if (result.autoClockedOut > 0 || result.backToActive > 0) {
        console.log(`[attendanceSweep] auto clock-outs: ${result.autoClockedOut}, back to active: ${result.backToActive}`);
      }
    } catch (err) {
      console.error('[attendanceSweep] failed:', err);
    }
  }, { timezone: 'UTC' });
  console.log('[attendanceSweep] Scheduled every 5 minutes');
};
