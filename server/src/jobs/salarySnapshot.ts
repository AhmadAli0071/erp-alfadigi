import cron from 'node-cron';
import { SalarySnapshot } from '../models/SalarySnapshot.js';
import { calcMonthLive } from '../utils/salaryCalc.js';

/**
 * Month-end snapshot job: on the 1st of every month at 00:05 AM PKT (19:05 UTC)
 * it locks the PREVIOUS month's salary calculation into SalarySnapshot history.
 * Re-running a month simply refreshes (idempotent upsert).
 */
export const lockMonthSnapshots = async (month: string): Promise<number> => {
  const rows = await calcMonthLive(month);
  for (const r of rows) {
    await SalarySnapshot.updateOne(
      { month, employeeId: r.employeeId },
      {
        $set: {
          empId: r.empId,
          name: r.name,
          email: r.email,
          department: r.department,
          jobTitle: r.jobTitle,
          baseSalary: r.baseSalary,
          perDayRate: r.perDayRate,
          requiredHoursPerDay: r.requiredHoursPerDay,
          expectedDays: r.expectedDays,
          expectedMinutes: r.expectedMinutes,
          workedMinutes: r.workedMinutes,
          otMinutes: r.otMinutes,
          paidLeaveDays: r.paidLeaveDays,
          unpaidLeaveDays: r.unpaidLeaveDays,
          absentDays: r.absentDays,
          shortfallMinutes: r.shortfallMinutes,
          countableMinutes: r.countableMinutes,
          payable: r.payable,
          deduction: r.deduction,
          finalPayable: r.finalPayable,
          log: r.log,
          lockedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
  return rows.length;
};

export const startSalarySnapshotJob = (): void => {
  cron.schedule('5 19 1 * *', async () => {
    try {
      const now = new Date(Date.now() - 5 * 60 * 60000); // previous month in PKT terms
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      const n = await lockMonthSnapshots(month);
      console.log(`[salarySnapshot] Locked ${month}: ${n} employees saved to history`);
    } catch (err) {
      console.error('[salarySnapshot] failed:', err);
    }
  }, { timezone: 'UTC' });
  console.log('[salarySnapshot] Scheduled monthly on 1st at 00:05 AM PKT');
};
