// Commission engine - Sales department only.
// Rules (confirmed by business):
//   Sales Agent (EMPLOYEE, Sales)        : monthly target $500  -> 10% of the amount ABOVE target
//   Sales Lead  (DEPARTMENT_LEAD, Sales) : monthly target $3000 -> 10% of the amount ABOVE target
//   Monthly reset (calendar month), target miss -> $0 commission.

export const COMMISSION_RATE = 0.1;
export const AGENT_MONTHLY_TARGET = 500;
export const LEAD_MONTHLY_TARGET = 3000;

export const monthlyTargetForRole = (role?: string | null): number =>
  role === 'DEPARTMENT_LEAD' ? LEAD_MONTHLY_TARGET : AGENT_MONTHLY_TARGET;

export const monthKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// "YYYY-MM" (ya undefined = current month) -> [start, end) range
export const monthRangeFromKey = (key?: unknown): { start: Date; end: Date; key: string } => {
  const now = new Date();
  const raw =
    typeof key === 'string' && /^\d{4}-\d{2}$/.test(key) ? key : monthKeyOf(now);
  const [y, m] = raw.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end, key: raw };
};

export interface CommissionResult {
  totalSales: number;
  target: number;
  unlocked: boolean;
  extraAmount: number;
  commission: number;
  rate: number;
}

export const computeCommission = (totalSales: number, target: number): CommissionResult => {
  const unlocked = totalSales >= target;
  const extraAmount = Math.max(0, totalSales - target);
  const commission = unlocked ? Number((extraAmount * COMMISSION_RATE).toFixed(2)) : 0;
  return { totalSales, target, unlocked, extraAmount, commission, rate: COMMISSION_RATE };
};
