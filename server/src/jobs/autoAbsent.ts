import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { Employee } from '../models/Employee.js';
import { Attendance, IAttendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { User } from '../models/User.js';
import { notifyEmails } from '../services/notificationService.js';
import { ensureSettings } from '../utils/defaults.js';
import { FACE_UPLOAD_ROOT } from '../utils/facePhotos.js';

/**
 * SHIFT: 6 PM – 3 AM (PKT, overnight) by default - configurable via
 * SystemSettings → attendance (shiftStart, shiftEnd, autoClockOutTime,
 * requiredWorkingHours, gracePeriodMinutes). All job timing is derived
 * from those settings.
 *
 * The auto-absent job runs daily at 22:05 UTC (3:05 AM PKT) - right after the
 * shift for the current UTC date has ended. Every active employee without an
 * attendance record for that date is marked Absent (or Leave if they had an
 * approved leave covering that date).
 *
 * The attendance sweep runs every 5 minutes and:
 *  - Auto clock-outs records still open at the auto clock-out time
 *    (default 08:00 AM PKT, configurable). The employee MISSED their
 *    clock-out: working minutes are zeroed, isAutoClockedOut is flagged,
 *    and a warning notification goes to the employee + lead + HR
 *    (hours are not counted in salary).
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
  autoOut: { h: number; m: number };
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
      autoOut: parseShiftTime(String(att.autoClockOutTime || '08:00 AM')),
      requiredWorkingHours: Number(att.requiredWorkingHours) || 7.67,
      graceMinutes: Number(att.gracePeriodMinutes) || 10,
    };
  } catch {
    return {
      start: { h: 18, m: 0 },
      end: { h: 3, m: 0 },
      autoOut: { h: 8, m: 0 },
      requiredWorkingHours: 7.67,
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
 * The UTC datetime at which `time` (PKT) falls for the shift that STARTED
 * on the given UTC record date (wraps to the next UTC day when needed —
 * e.g. auto clock-out at 08:00 AM PKT for a 6 PM shift → next day 03:00 UTC).
 */
const pktTimeUtcFor = (recordDate: string, time: { h: number; m: number }, cfg: AttendanceConfig): Date => {
  const startUtc = pktToUtcMinutes(cfg.start.h, cfg.start.m);
  const endUtc = pktToUtcMinutes(time.h, time.m);
  const base = new Date(`${recordDate}T00:00:00Z`);
  const start = new Date(base);
  start.setUTCHours(startUtc.h, startUtc.m, 0, 0);
  const end = new Date(base);
  end.setUTCHours(endUtc.h, endUtc.m, 0, 0);
  if (end <= start) end.setTime(end.getTime() + MS_DAY);
  return end;
};

/** UTC instant of the configured auto clock-out (default 08:00 AM PKT). */
const autoClockOutUtcFor = (recordDate: string, cfg: AttendanceConfig): Date =>
  pktTimeUtcFor(recordDate, cfg.autoOut, cfg);

const statusForWorkingMinutes = (working: number, requiredHours: number): IAttendance['status'] => {
  // Half Day is no longer auto-assigned from working minutes —
  // only 2 lates in a month count as 1 Half Day (applied in salary calc).
  if (working >= Math.round(requiredHours * 60)) return 'Present';
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

  // 1) Auto clock-out: open-ended records still open at the auto clock-out
  //    time (default 08:00 AM PKT). Missed clock-out → 0 working hours.
  const openRecords = await Attendance.find({
    clockIn: { $exists: true, $ne: '' },
    $or: [{ clockOut: { $exists: false } }, { clockOut: '' }, { clockOut: null }],
  });

  for (const rec of openRecords) {
    const autoOutAt = autoClockOutUtcFor(utcDateFor(new Date(rec.clockInAt || rec.date)), cfg);
    if (now.getTime() < autoOutAt.getTime()) continue;

    const outText = formatShiftTime(cfg.autoOut.h, cfg.autoOut.m);
    rec.clockOut = outText;
    rec.clockOutAt = autoOutAt;
    rec.isAutoClockedOut = true;
    // HR manually set working hours → punch-derived minutes must not overwrite them
    if (!rec.hoursManuallySet) {
      rec.workingMinutes = 0;
      // Respect explicit HR designations - WFH / On Duty / Late are not recomputed by minutes
      if (rec.status !== 'Work From Home' && rec.status !== 'On Duty' && rec.status !== 'Late') {
        rec.status = statusForWorkingMinutes(0, cfg.requiredWorkingHours);
      }
    }
    rec.notes = `${rec.notes ? `${rec.notes} | ` : ''}Auto clock-out at ${outText} (PKT) — missed clock-out, hours not counted`;
    await rec.save();
    autoClockedOut++;

    const emp = await Employee.findById(rec.employeeId);
    if (emp) {
      const title = 'Missed Clock-Out — Hours Not Counted';
      const message = `You did not clock out on time for ${rec.date}. The system automatically clocked you out at ${outText} (PKT). Your working hours are not shown and will not be counted in your salary. If this happened by mistake, please contact HR.`;
      // Employee directly
      await notifyEmails([emp.email], { title, message, type: 'attendance', relatedId: String(rec._id) });
      // Lead + HR (same helper pattern as routes/attendance.ts notifyAttendanceEvent)
      if (emp.reportedTo) {
        const lead = await Employee.findById(emp.reportedTo);
        if (lead) await notifyEmails([lead.email], { title, message, type: 'attendance', relatedId: String(rec._id) });
      }
      const hrUsers = await User.find({ role: { $in: ['HR_ADMIN', 'SUPER_ADMIN'] }, isActive: true }).select('email');
      await notifyEmails(hrUsers.map((u) => u.email), { title, message, type: 'attendance', relatedId: String(rec._id) });
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
        message: `You were marked Absent for ${date}. No clock-in was recorded. Contact HR if this is incorrect.`,
        type: 'attendance',
      });
    }
  }

  return { date, scannedEmployees: employees.length, markedAbsent, markedLeave };
};

/**
 * Face-photo retention: photos are deleted the next day at 08:00 AM PKT
 * (after HR has had the night + morning to verify). Any record still PENDING
 * flips to EXPIRED so the HR queue drops it.
 * Run daily at 03:10 UTC = 08:10 AM PKT.
 */
export const runFacePhotoRetention = async (): Promise<{ filesDeleted: number; expired: number }> => {
  let filesDeleted = 0;
  let expired = 0;

  // Flip still-pending captures older than today → EXPIRED (drop from HR queue)
  const todayUtc = utcDateFor(new Date());
  const stale = await Attendance.find({
    'faceCapture.status': 'PENDING',
    date: { $lt: todayUtc },
  });
  for (const rec of stale) {
    if (!rec.faceCapture) continue;
    rec.faceCapture.status = 'EXPIRED';
    await rec.save();
    expired++;
  }

  // Delete any photo file no longer referenced by today's records.
  // (Per policy every photo is removed the next morning, so only keep
  //  files belonging to records dated today or later.)
  try {
    if (fs.existsSync(FACE_UPLOAD_ROOT)) {
      for (const name of fs.readdirSync(FACE_UPLOAD_ROOT)) {
        const stillNeeded = await Attendance.exists({
          'faceCapture.file': name,
          'faceCapture.status': { $in: ['PENDING', 'VERIFIED', 'REJECTED'] },
        });
        if (!stillNeeded) {
          try {
            fs.unlinkSync(path.join(FACE_UPLOAD_ROOT, name));
            filesDeleted++;
          } catch {
            /* ignore individual file errors */
          }
        }
      }
    }
  } catch (err) {
    console.error('[faceRetention] file sweep failed:', err);
  }

  return { filesDeleted, expired };
};

export const startAutoAbsentJob = (): void => {
  // 22:05 UTC = 3:05 AM PKT - daily, right after the 6 PM – 3 AM shift ends.
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

  // Face-photo retention: 03:10 UTC = 08:10 AM PKT daily
  cron.schedule('10 3 * * *', async () => {
    try {
      const result = await runFacePhotoRetention();
      if (result.filesDeleted > 0 || result.expired > 0) {
        console.log(`[faceRetention] deleted ${result.filesDeleted} photos, expired ${result.expired} pending captures`);
      }
    } catch (err) {
      console.error('[faceRetention] failed:', err);
    }
  }, { timezone: 'UTC' });
  console.log('[faceRetention] Scheduled daily at 03:10 UTC (08:10 AM PKT)');
};
