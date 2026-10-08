import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { Leave } from '../models/Leave.js';
import { LeaveType } from '../models/LeaveType.js';
import { getAttendanceConfig } from '../jobs/autoAbsent.js';
import { SalaryLogEntry } from '../models/SalarySnapshot.js';
import { SalaryAdjustment } from '../models/SalaryAdjustment.js';

/** Salary is divided on a FIXED 30-day month (business rule). */
export const SALARY_MONTH_DAYS = 30;
const PKT_OFFSET_MIN = 5 * 60;

export const currentMonth = (): string =>
  new Date(Date.now() + PKT_OFFSET_MIN * 60000).toISOString().slice(0, 7);

export interface SalaryCalcRow {
  employeeId: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  baseSalary: number;
  perDayRate: number;
  requiredHoursPerDay: number;
  expectedDays: number;
  expectedMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  shortfallMinutes: number;
  countableMinutes: number;
  payable: number;
  deduction: number;
  finalPayable: number;
  adjustments: {
    id: string;
    type: 'bonus' | 'deduction' | 'override';
    amount: number;
    reason: string;
    byName: string;
    createdAt: string;
  }[];
  log: SalaryLogEntry[];
  source: 'live' | 'snapshot';
}
const fmtHM = (mins: number): string => `${Math.floor(mins / 60)}h ${mins % 60}m`;

/** Parses "hh:mm AM/PM" into minutes since midnight (null if unparseable). */
const parseAmPmToMinutes = (t: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(String(t).trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 1 || h > 12 || min > 59) return null;
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

/** Saturday / Sunday — paid non-working days for every employee. */
const isWeekendDate = (date: string): boolean => {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
};

const dayName = (date: string): string => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(`${date}T00:00:00Z`).getUTCDay()];

/** Every calendar date from the employee's start (joinedDate or month start) to month end. */
const windowDates = (joinedDate: string | undefined, month: string): string[] => {
  const [y, m] = month.split('-').map(Number);
  const monthEndDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${month}-${String(monthEndDay).padStart(2, '0')}`;
  const valid = !!joinedDate && /^\d{4}-\d{2}-\d{2}$/.test(joinedDate);
  if (valid && joinedDate! > monthEnd) return [];
  const monthStart = `${month}-01`;
  const start = valid && joinedDate! > monthStart ? joinedDate! : monthStart;
  const startDay = Math.max(1, Number(start.slice(8, 10)) || 1);
  const dates: string[] = [];
  for (let d = startDay; d <= monthEndDay; d++) dates.push(`${month}-${String(d).padStart(2, '0')}`);
  return dates;
};

const expandLeaveDates = (start: string, end: string, month: string): string[] => {
  const dates: string[] = [];
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  let cur = start > monthStart ? start : monthStart;
  const last = end < monthEnd ? end : monthEnd;
  let guard = 0;
  while (cur <= last && cur.startsWith(`${month}-`) && guard < 40) {
    dates.push(cur);
    const d = new Date(`${cur}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    cur = d.toISOString().split('T')[0];
    guard++;
  }
  return dates;
};

/**
 * Builds the full working-hours-based salary calculation for one employee
 * over a month, including the human-readable deduction/credit log.
 */
export const calcEmployeeMonth = async (
  employee: { _id: unknown; empId: string; name: string; email: string; department: string; jobTitle?: string; salary: number; joinedDate?: string },
  month: string,
  cfg: { requiredHoursPerDay: number; shiftEndMin?: number },
  now: Date
): Promise<SalaryCalcRow> => {
  const requiredMinutes = Math.max(1, Math.round(cfg.requiredHoursPerDay * 60));
  // Expected days = every calendar day the employee existed this month (join-date aware).
  const window = windowDates(employee.joinedDate, month);
  const expectedDays = window.length;
  const expectedMinutes = expectedDays * requiredMinutes;
  const baseSalary = Math.max(0, employee.salary || 0);
  const perDayRate = baseSalary / SALARY_MONTH_DAYS;
  const perMinuteRate = expectedMinutes > 0 ? baseSalary / expectedMinutes : 0;
  // Sat/Sun are non-working but PAID for every employee — never deducted, even when
  // the auto-absent sweep marks them Absent.
  const weekendDates = window.filter(isWeekendDate);
  const weekendSet = new Set(weekendDates);

  const [records, leaves, leaveTypes] = await Promise.all([
    Attendance.find({ employeeId: employee._id as never, date: new RegExp(`^${month}-`) }).sort({ date: 1 }),
    Leave.find({
      employeeId: employee._id as never,
      status: { $in: ['Approved', 'Final Approved'] },
      $or: [
        { startDate: new RegExp(`^${month}-`) },
        { endDate: new RegExp(`^${month}-`) },
        { startDate: { $lte: `${month}-01` }, endDate: { $gte: `${month}-31` } },
      ],
    }),
    LeaveType.find({}),
  ]);

  const paidTypeNames = new Set(
    leaveTypes.filter((t) => t.isPaid !== false).map((t) => t.name.toLowerCase())
  );

  const paidLeaveDates = new Set<string>();
  const unpaidLeaveDates = new Set<string>();
  for (const lv of leaves) {
    const target = paidTypeNames.has(String(lv.leaveType).toLowerCase()) ? paidLeaveDates : unpaidLeaveDates;
    for (const d of expandLeaveDates(lv.startDate, lv.endDate, month)) target.add(d);
  }

  const monthPrefix = `${month}-`;
  const today = new Date(now.getTime() + PKT_OFFSET_MIN * 60000).toISOString().split('T')[0];

  let workedMinutes = 0;
  let otMinutes = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let paidWeekendDays = 0;
  let shortfallMinutes = 0;
  const log: SalaryLogEntry[] = [];

  // Late policy: every late = 5-min salary penalty; every 2nd late = 1 Half Day (half-day cut)
  let lateCount = 0;
  let penaltyMinutes = 0;
  const applyLatePenaltyLog = (date: string): void => {
    lateCount++;
    const latePenalty = 5;
    penaltyMinutes += latePenalty;
    log.push({ date, type: '-', reason: 'Late arrival — 5 min salary penalty', minutes: latePenalty, amount: Math.round(latePenalty * perMinuteRate) });
    if (lateCount % 2 === 0) {
      const halfMin = Math.round(requiredMinutes / 2);
      penaltyMinutes += halfMin;
      log.push({ date, type: '-', reason: `${lateCount} lates this month → Half Day applied (half-day salary cut)`, minutes: halfMin, amount: Math.round(halfMin * perMinuteRate) });
    }
  };

  for (const rec of records) {
    const isToday = rec.date === today;
    // Weekends are paid non-working days: never absent, never short, no late penalty.
    if (weekendSet.has(rec.date)) {
      if (rec.otStatus === 'APPROVED' && rec.otApprovedMinutes > 0) {
        otMinutes += rec.otApprovedMinutes;
        log.push({
          date: rec.date,
          type: '+',
          reason: `Approved overtime — ${fmtHM(rec.otApprovedMinutes)}`,
          minutes: rec.otApprovedMinutes,
          amount: Math.round(rec.otApprovedMinutes * perMinuteRate),
        });
      }
      continue;
    }
    if (rec.status === 'Leave') {
      if (paidLeaveDates.has(rec.date)) {
        paidLeaveDays++;
        log.push({ date: rec.date, type: '+', reason: `Paid leave (full day credit)`, minutes: requiredMinutes, amount: Math.round(requiredMinutes * perMinuteRate) });
      } else if (unpaidLeaveDates.has(rec.date)) {
        unpaidLeaveDays++;
        const amount = Math.round(requiredMinutes * perMinuteRate);
        log.push({ date: rec.date, type: '-', reason: 'Unpaid leave (full day)', minutes: requiredMinutes, amount });
        shortfallMinutes += requiredMinutes;
      }
      continue;
    }

    if (rec.status === 'Absent') {
      absentDays++;
      const amount = Math.round(requiredMinutes * perMinuteRate);
      log.push({ date: rec.date, type: '-', reason: 'Absent — no clock-in', minutes: requiredMinutes, amount });
      shortfallMinutes += requiredMinutes;
      continue;
    }

    // Present / Late / Half Day / Short Hours / WFH / On Duty — count actual minutes
    let dayMinutes = rec.workingMinutes || 0;
    if (isToday && rec.clockIn && !rec.clockOut && rec.clockInAt) {
      // Open shift: live minutes so far (minus finished + ongoing breaks)
      let live = Math.round((now.getTime() - new Date(rec.clockInAt).getTime()) / 60000);
      live -= rec.breakMinutes || 0;
      if (rec.breakStartedAt) live -= Math.round((now.getTime() - new Date(rec.breakStartedAt).getTime()) / 60000);
      dayMinutes = Math.max(0, live);
      const runningShort = Math.max(0, requiredMinutes - dayMinutes);
      if (runningShort > 0) {
        log.push({ date: rec.date, type: '-', reason: `In shift (running) — ${fmtHM(dayMinutes)} of ${fmtHM(requiredMinutes)}`, minutes: runningShort, amount: Math.round(runningShort * perMinuteRate) });
      } else {
        log.push({ date: rec.date, type: '+', reason: `In shift (running) — full ${fmtHM(requiredMinutes)} covered`, minutes: 0, amount: 0 });
      }
      shortfallMinutes += runningShort;
      workedMinutes += dayMinutes;
      if (rec.status === 'Late') applyLatePenaltyLog(rec.date);
      continue;
    }

    // Late arrival: if the employee stayed until shift end, the missing minutes
    // are due to the late start — covered by the fixed 5-min late penalty.
    if (rec.status === 'Late') {
      const endMin = cfg.shiftEndMin;
      const inMin = rec.clockIn ? parseAmPmToMinutes(rec.clockIn) : null;
      const outMin = rec.clockOut ? parseAmPmToMinutes(rec.clockOut) : null;
      let stayedTillEnd = false;
      if (endMin !== undefined && inMin !== null && outMin !== null) {
        let outAdj = outMin;
        if (outAdj < inMin) outAdj += 1440; // clock-out crossed midnight
        let endAdj = endMin;
        if (endAdj <= inMin) endAdj += 1440; // overnight shift end
        stayedTillEnd = outAdj >= endAdj;
      }
      if (stayedTillEnd && dayMinutes < requiredMinutes) dayMinutes = requiredMinutes;
    }

    workedMinutes += dayMinutes;
    const short = Math.max(0, requiredMinutes - dayMinutes);
    if (short > 0) {
      const label =
        rec.status === 'Half Day'
          ? `Half day — ${fmtHM(dayMinutes)} of ${fmtHM(requiredMinutes)}`
          : `Short hours — ${fmtHM(dayMinutes)} of ${fmtHM(requiredMinutes)}`;
      const amount = Math.round(short * perMinuteRate);
      log.push({ date: rec.date, type: '-', reason: label, minutes: short, amount });
      shortfallMinutes += short;
    }

    if (rec.status === 'Late') applyLatePenaltyLog(rec.date);

    if (rec.otStatus === 'APPROVED' && rec.otApprovedMinutes > 0) {
      otMinutes += rec.otApprovedMinutes;
      log.push({
        date: rec.date,
        type: '+',
        reason: `Approved overtime — ${fmtHM(rec.otApprovedMinutes)}`,
        minutes: rec.otApprovedMinutes,
        amount: Math.round(rec.otApprovedMinutes * perMinuteRate),
      });
    }
  }

  // Saturday/Sunday are paid for everyone — credit each elapsed weekend as a full
  // paid day (only weekends already passed, matching how elapsed weekdays count).
  for (const d of weekendDates) {
    if (d > today) continue;
    paidWeekendDays++;
    log.push({
      date: d,
      type: '+',
      reason: `${dayName(d)} — weekend (paid non-working day)`,
      minutes: requiredMinutes,
      amount: Math.round(requiredMinutes * perMinuteRate),
    });
  }

  shortfallMinutes += penaltyMinutes;
  const countableMinutes = Math.min(
    expectedMinutes,
    Math.max(0, workedMinutes + otMinutes + paidLeaveDays * requiredMinutes + paidWeekendDays * requiredMinutes - penaltyMinutes)
  );
  const payable = expectedMinutes > 0 ? Math.round(baseSalary * (countableMinutes / expectedMinutes)) : 0;
  const deduction = Math.max(0, baseSalary - payable);

  log.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    employeeId: String(employee._id),
    empId: employee.empId,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    jobTitle: employee.jobTitle || '',
    baseSalary,
    perDayRate: Math.round(perDayRate),
    requiredHoursPerDay: cfg.requiredHoursPerDay,
    expectedDays,
    expectedMinutes,
    workedMinutes,
    otMinutes,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    shortfallMinutes,
    countableMinutes,
    payable,
    deduction,
    finalPayable: payable,
    adjustments: [],
    log,
    source: 'live',
  };
};

/** Manual adjustment shape (from SalaryAdjustment docs). */
export interface AdjLike {
  _id: { toString(): string };
  type: 'bonus' | 'deduction' | 'override';
  amount: number;
  reason: string;
  byName: string;
  createdAt: Date;
}

/**
 * Merges manual HR adjustments (bonus / deduction / full override) into a
 * calculated row: returns finalPayable and appends [Manual] log entries.
 */
export const applyAdjustments = (row: SalaryCalcRow, docs: AdjLike[]): SalaryCalcRow => {
  if (docs.length === 0) return { ...row, adjustments: [], finalPayable: row.payable };

  const stamp = new Date(Date.now() + PKT_OFFSET_MIN * 60000).toISOString().split('T')[0];
  const adjustments = docs.map((d) => ({
    id: d._id.toString(),
    type: d.type,
    amount: d.amount,
    reason: d.reason,
    byName: d.byName,
    createdAt: new Date(d.createdAt).toISOString(),
  }));

  let final = row.payable;
  let lastOverride: AdjLike | null = null;
  for (const d of docs) {
    if (d.type === 'bonus') {
      final += d.amount;
      row.log.push({
        date: stamp,
        type: '+',
        reason: `[Manual] Bonus by ${d.byName}${d.reason ? ` — ${d.reason}` : ''}`,
        minutes: 0,
        amount: d.amount,
      });
    } else if (d.type === 'deduction') {
      final -= d.amount;
      row.log.push({
        date: stamp,
        type: '-',
        reason: `[Manual] Deduction by ${d.byName}${d.reason ? ` — ${d.reason}` : ''}`,
        minutes: 0,
        amount: d.amount,
      });
    } else {
      lastOverride = d;
    }
  }
  if (lastOverride) {
    row.log.push({
      date: stamp,
      type: '+',
      reason: `[Manual] Payable override by ${lastOverride.byName} — set to PKR ${lastOverride.amount.toLocaleString('en-US')}${lastOverride.reason ? ` — ${lastOverride.reason}` : ''}`,
      minutes: 0,
      amount: 0,
    });
    final = lastOverride.amount;
  }

  const finalRounded = Math.max(0, Math.round(final));
  return {
    ...row,
    adjustments,
    finalPayable: finalRounded,
    deduction: Math.max(0, Math.round(row.baseSalary - finalRounded)),
    log: [...row.log].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  };
};

/** Live calculation for all active employees over a month (adjustments merged). */
export const calcMonthLive = async (month: string): Promise<SalaryCalcRow[]> => {
  const cfg = await getAttendanceConfig();
  const now = new Date();
  const [employees, allAdjustments] = await Promise.all([
    Employee.find({ isActive: true }).select('empId name email department jobTitle salary joinedDate'),
    SalaryAdjustment.find({ month }).sort({ createdAt: 1 }),
  ]);
  const adjByEmp = new Map<string, typeof allAdjustments>();
  for (const a of allAdjustments) {
    const key = String(a.employeeId);
    const list = adjByEmp.get(key) || [];
    list.push(a);
    adjByEmp.set(key, list);
  }
  const rows = await Promise.all(
    employees.map(async (e) => {
      const row = await calcEmployeeMonth(
        { _id: e._id, empId: e.empId, name: e.name, email: e.email, department: e.department, jobTitle: e.jobTitle, salary: e.salary, joinedDate: e.joinedDate },
        month,
        { requiredHoursPerDay: cfg.requiredWorkingHours, shiftEndMin: cfg.end.h * 60 + cfg.end.m },
        now
      );
      return applyAdjustments(row, adjByEmp.get(String(e._id)) || []);
    })
  );
  return rows.sort((a, b) => a.empId.localeCompare(b.empId));
};
