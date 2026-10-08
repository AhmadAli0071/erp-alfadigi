import { Router, Response } from 'express';
import { SalarySnapshot } from '../models/SalarySnapshot.js';
import { SalaryAdjustment } from '../models/SalaryAdjustment.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { Employee } from '../models/Employee.js';
import { calcMonthLive, calcEmployeeMonth, applyAdjustments, currentMonth, SalaryCalcRow, AdjLike } from '../utils/salaryCalc.js';
import { getAttendanceConfig } from '../jobs/autoAbsent.js';

const router = Router();

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Snapshot rows for a past month, falling back to live preview if not locked yet. */
const rowsForMonth = async (month: string): Promise<{ rows: SalaryCalcRow[]; source: 'snapshot' | 'live' }> => {
  if (month >= currentMonth()) {
    return { rows: await calcMonthLive(month), source: 'live' };
  }
  const [snaps, adjustments] = await Promise.all([
    SalarySnapshot.find({ month }).sort({ empId: 1 }),
    SalaryAdjustment.find({ month }).sort({ createdAt: 1 }),
  ]);
  if (snaps.length === 0) {
    const rows = await calcMonthLive(month);
    return { rows, source: 'live' };
  }
  const adjByEmp = new Map<string, AdjLike[]>();
  for (const a of adjustments) {
    const key = String(a.employeeId);
    const list = adjByEmp.get(key) || [];
    list.push({
      _id: a._id,
      type: a.type,
      amount: a.amount,
      reason: a.reason,
      byName: a.byName,
      createdAt: a.createdAt,
    });
    adjByEmp.set(key, list);
  }
  const baseRows: SalaryCalcRow[] = snaps.map((s) => ({
    employeeId: String(s.employeeId),
    empId: s.empId,
    name: s.name,
    email: s.email,
    department: s.department,
    jobTitle: s.jobTitle,
    baseSalary: s.baseSalary,
    perDayRate: s.perDayRate,
    requiredHoursPerDay: s.requiredHoursPerDay,
    expectedDays: s.expectedDays,
    expectedMinutes: s.expectedMinutes,
    workedMinutes: s.workedMinutes,
    otMinutes: s.otMinutes,
    paidLeaveDays: s.paidLeaveDays,
    unpaidLeaveDays: s.unpaidLeaveDays,
    absentDays: s.absentDays,
    shortfallMinutes: s.shortfallMinutes,
    countableMinutes: s.countableMinutes,
    payable: s.payable,
    deduction: s.deduction,
    finalPayable: s.finalPayable || s.payable,
    adjustments: [],
    log: s.log,
    source: 'snapshot',
  }));
  const rows = baseRows.map((r) => applyAdjustments(r, adjByEmp.get(r.employeeId) || []));
  return { rows, source: 'snapshot' };
};

const filterRows = (rows: SalaryCalcRow[], department?: string, search?: string): SalaryCalcRow[] =>
  rows
    .filter((r) => !department || r.department === department)
    .filter(
      (r) =>
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.empId.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    );

// GET /api/salary-calc/month?month=YYYY-MM&department=&search=
router.get('/month', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN', 'HOD'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month)) ? String(req.query.month) : currentMonth();
    const { rows, source } = await rowsForMonth(month);
    const filtered = filterRows(rows, req.query.department ? String(req.query.department) : undefined, req.query.search ? String(req.query.search) : undefined);
    const deptTotals: Record<string, { payable: number; deduction: number; base: number }> = {};
    for (const r of filtered) {
      const t = (deptTotals[r.department] ||= { payable: 0, deduction: 0, base: 0 });
      t.payable += r.finalPayable;
      t.deduction += Math.max(0, r.baseSalary - r.finalPayable);
      t.base += r.baseSalary;
    }
    res.json({
      month,
      source,
      requiredHoursPerDay: filtered[0]?.requiredHoursPerDay ?? 8,
      rows: filtered,
      deptTotals,
      grandTotal: {
        base: filtered.reduce((n, r) => n + r.baseSalary, 0),
        payable: filtered.reduce((n, r) => n + r.finalPayable, 0),
        deduction: filtered.reduce((n, r) => n + Math.max(0, r.baseSalary - r.finalPayable), 0),
      },
    });
  } catch (err) {
    console.error('Salary calc month error:', err);
    res.status(500).json({ error: 'Unable to calculate salaries.' });
  }
});

// GET /api/salary-calc/me?month=YYYY-MM — own calculation (any role)
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month)) ? String(req.query.month) : currentMonth();
    const { rows, source } = await rowsForMonth(month);
    const row = rows.find((r) => r.email === req.user!.email.toLowerCase());
    if (!row) {
      res.status(404).json({ error: 'No calculation available yet.' });
      return;
    }
    res.json({ month, row, source });
  } catch (err) {
    console.error('Salary calc me error:', err);
    res.status(500).json({ error: 'Unable to load your calculation.' });
  }
});

// POST /api/salary-calc/lock/:month — HR/SA locks (or refreshes) a month's snapshots
router.post('/lock/:month', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = String(req.params.month);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: 'Invalid month format (YYYY-MM).' });
      return;
    }
    const rows = await calcMonthLive(month);
    let upserts = 0;
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
      upserts++;
    }
    console.warn(`[audit] Salary snapshots LOCKED: ${month} (${upserts} employees) by ${req.user?.email}`);
    res.json({ success: true, month, employees: upserts });
  } catch (err) {
    console.error('Salary lock error:', err);
    res.status(500).json({ error: 'Unable to lock salary snapshots.' });
  }
});

// PUT /api/salary-calc/base/:employeeId - direct base salary update (HR/SA, no approval needed)
router.put('/base/:employeeId', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newSalary = Number(req.body?.newSalary);
    const reason = String(req.body?.reason || '').slice(0, 300);
    if (!Number.isFinite(newSalary) || newSalary < 0) {
      res.status(400).json({ error: 'New salary must be a positive number.' });
      return;
    }
    const emp = await Employee.findById(req.params.employeeId);
    if (!emp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }
    if (emp.email.toLowerCase() === req.user!.email.toLowerCase()) {
      res.status(403).json({ error: 'You cannot change your own salary.' });
      return;
    }
    if (emp.salary === newSalary) {
      res.status(400).json({ error: 'New salary is the same as the current salary.' });
      return;
    }
    const oldSalary = emp.salary;
    emp.salary = newSalary;
    await emp.save();
    console.warn(`[audit] Base salary DIRECT UPDATE: ${emp.email} PKR ${oldSalary.toLocaleString('en-US')} -> PKR ${newSalary.toLocaleString('en-US')} by ${req.user!.email} (${req.user!.role}) — ${reason || 'no reason'}`);
    res.json({ success: true, oldSalary, newSalary });
  } catch (err) {
    console.error('Base salary update error:', err);
    res.status(500).json({ error: 'Unable to update base salary.' });
  }
});

// POST /api/salary-calc/adjust - add a manual adjustment (HR/SA)
router.post('/adjust', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, employeeId, type, amount, reason } = req.body as {
      month?: string; employeeId?: string; type?: string; amount?: number; reason?: string;
    };
    if (!/^\d{4}-\d{2}$/.test(String(month)) || !employeeId || !['bonus', 'deduction', 'override'].includes(String(type))) {
      res.status(400).json({ error: 'month, employeeId and a valid type (bonus/deduction/override) are required.' });
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      res.status(400).json({ error: 'Amount must be a positive number.' });
      return;
    }
    if (type === 'override' && amt > 5000000) {
      res.status(400).json({ error: 'Override amount looks invalid.' });
      return;
    }
    const emp = await Employee.findById(employeeId);
    if (!emp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }
    // Only one active override per employee per month - replace the old one
    if (type === 'override') {
      await SalaryAdjustment.deleteMany({ month, employeeId: emp._id, type: 'override' });
    }
    const adj = await SalaryAdjustment.create({
      month,
      employeeId: emp._id,
      empId: emp.empId,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      type,
      amount: Math.round(amt),
      reason: String(reason || '').slice(0, 300),
      byName: req.user!.name,
      byEmail: req.user!.email,
    });
    console.warn(`[audit] Salary ADJUSTMENT (${type} PKR ${Math.round(amt)}): ${emp.email} for ${month} by ${req.user!.email} — ${reason || 'no reason'}`);
    res.status(201).json({ success: true, adjustment: { id: adj._id.toString(), type, amount: Math.round(amt) } });
  } catch (err) {
    console.error('Salary adjust error:', err);
    res.status(500).json({ error: 'Unable to save adjustment.' });
  }
});

// DELETE /api/salary-calc/adjust/:id - remove a manual adjustment (HR/SA)
router.delete('/adjust/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adj = await SalaryAdjustment.findById(req.params.id);
    if (!adj) {
      res.status(404).json({ error: 'Adjustment not found.' });
      return;
    }
    await adj.deleteOne();
    console.warn(`[audit] Salary adjustment REMOVED (${adj.type} PKR ${adj.amount}): ${adj.email} for ${adj.month} by ${req.user!.email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Salary adjust delete error:', err);
    res.status(500).json({ error: 'Unable to remove adjustment.' });
  }
});

// GET /api/salary-calc/month/export?month=&department= — CSV download
router.get('/month/export', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN', 'HOD'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month)) ? String(req.query.month) : currentMonth();
    const { rows } = await rowsForMonth(month);
    const filtered = filterRows(rows, req.query.department ? String(req.query.department) : undefined);
    const fmtH = (m: number) => `${(m / 60).toFixed(1)}h`;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push(`Salary Calculation,${month},30-day basis`);
    lines.push(`Employee ID,Name,Department,Job Title,Base Salary (PKR),Per Day (PKR),Expected Hours,Worked Hours,OT Hours,Paid Leave (days),Unpaid Leave (days),Absent (days),Shortfall Hours,Calculated (PKR),Adjustments (PKR),Final Payable (PKR),Deduction (PKR)`);
    for (const r of filtered) {
      const adjDelta = r.finalPayable - r.payable;
      lines.push(
        [r.empId, esc(r.name), r.department, esc(r.jobTitle), r.baseSalary, r.perDayRate, fmtH(r.expectedMinutes), fmtH(r.workedMinutes), fmtH(r.otMinutes), r.paidLeaveDays, r.unpaidLeaveDays, r.absentDays, fmtH(r.shortfallMinutes), r.payable, adjDelta, r.finalPayable, Math.max(0, r.baseSalary - r.finalPayable)].join(',')
      );
    }
    lines.push('');
    lines.push(`TOTAL,,,,${filtered.reduce((n, r) => n + r.baseSalary, 0)},,,,,,,,,,${filtered.reduce((n, r) => n + r.payable, 0)},${filtered.reduce((n, r) => n + (r.finalPayable - r.payable), 0)},${filtered.reduce((n, r) => n + r.finalPayable, 0)},${filtered.reduce((n, r) => n + Math.max(0, r.baseSalary - r.finalPayable), 0)}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="salary-calc-${month}.csv"`);
    res.send('\uFEFF' + lines.join('\n'));
  } catch (err) {
    console.error('Salary export error:', err);
    res.status(500).json({ error: 'Unable to export.' });
  }
});

export default router;
