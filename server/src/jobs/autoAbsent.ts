import cron from 'node-cron';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { notifyEmails } from '../services/notificationService.js';

/**
 * SHIFT: 6 PM – 3 AM (PKT, overnight).
 * The whole shift falls within ONE UTC date:
 *   6 PM PKT = 13:00 UTC (same day) and 3 AM PKT next day = 22:00 UTC (still same UTC date).
 * So attendance `date` = UTC date of the clock-in.
 *
 * The auto-absent job runs daily at 22:05 UTC (3:05 AM PKT) — right after the
 * shift for the current UTC date has ended. Every active employee without an
 * attendance record for that date is marked Absent (or Leave if they had an
 * approved leave covering that date).
 */

export interface AbsentScanResult {
  date: string;
  scannedEmployees: number;
  markedAbsent: number;
  markedLeave: number;
}

const utcDateFor = (d: Date): string => d.toISOString().split('T')[0];

export const runAbsentScan = async (explicitDate?: string): Promise<AbsentScanResult> => {
  // Default: last COMPLETED shift (yesterday's UTC date) for manual runs.
  const date = explicitDate || utcDateFor(new Date(Date.now() - 24 * 60 * 60 * 1000));

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
};
