import React, { useState, useEffect, useCallback } from 'react';
import { CommissionSummary, Sale, currentMonthKey, fmtUSD } from '../../types/sales';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Wallet,
  BadgeDollarSign,
  Coins,
  Lock,
  Unlock,
  Target,
  Clock,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';

interface SalaryCalcRow {
  baseSalary: number;
  perDayRate: number;
  requiredHoursPerDay: number;
  expectedDays?: number;
  expectedMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  paidLeaveDays: number;
  shortfallMinutes: number;
  countableMinutes: number;
  payable: number;
  finalPayable?: number;
  adjustments?: { id: string; type: string; amount: number; reason: string; byName: string }[];
  deduction: number;
  log: { date: string; type: '-' | '+'; reason: string; minutes: number; amount: number }[];
  source: 'live' | 'snapshot';
}

interface SalaryEarningsViewProps {
  onNavigateToDashboard: () => void;
}

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtHM = (mins: number): string => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

/** Last 6 months for the month selector (newest first). */
const MONTH_OPTIONS = (() => {
  const opts: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return opts;
})();

export const SalaryEarningsView: React.FC<SalaryEarningsViewProps> = ({ onNavigateToDashboard }) => {
  const [salary, setSalary] = useState<number | undefined>(undefined);
  const [jobTitle, setJobTitle] = useState('');
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [calc, setCalc] = useState<SalaryCalcRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonthKey());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getHeaders();
      const [meRes, commRes, salesRes, calcRes] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { headers }),
        fetch(`${API_BASE}/sales/commission/my?month=${month}`, { headers }),
        fetch(`${API_BASE}/sales/my?month=${month}`, { headers }),
        fetch(`${API_BASE}/salary-calc/me?month=${month}`, { headers }),
      ]);
      if (meRes.ok) {
        const d = await meRes.json();
        setSalary(d.employee?.salary);
        setJobTitle(d.employee?.jobTitle || '');
      }
      if (commRes.ok) {
        const d = await commRes.json();
        setCommission(d.eligible ? d : null);
      }
      if (salesRes.ok) setSales((await salesRes.json()).sales || []);
      if (calcRes.ok) {
        const d = await calcRes.json();
        setCalc(d.row || null);
      } else {
        setCalc(null);
      }
    } catch {
      setError('Unable to load salary & earnings data.');
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEarning = (salary || 0) + (commission?.commission || 0);
  const pct = commission && commission.target > 0 ? Math.min(100, Math.round((commission.totalSales / commission.target) * 100)) : 0;
  const monthName = MONTH_OPTIONS.find((o) => o.key === month)?.label || month;
  const isCurrentMonth = month === currentMonthKey();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="p-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Salary & Earnings</h1>
              <p className="text-[11px] text-slate-500 font-medium">{jobTitle || 'Your'}, {monthName} overview</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-fit sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}{o.key === currentMonthKey() ? ' (current)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${commission ? 'lg:grid-cols-3' : ''}`}>        {/* My Salary */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-5 shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-600/30">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/[0.07] blur-lg" aria-hidden="true" />
          <Wallet className="absolute -right-3 -bottom-3 w-24 h-24 text-white/[0.08] rotate-12" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[9px] font-extrabold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                Monthly
              </span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/90 mt-4">My Salary</div>
            <div className="text-[28px] leading-tight font-extrabold text-white mt-0.5 tracking-tight">
              {salary !== undefined ? fmtUSD(salary) : '-'}
            </div>
            <div className="text-[11px] font-medium text-indigo-100/80 mt-1">Current monthly salary</div>
          </div>
        </div>

        {/* My Commission (Sales only) */}
        {commission && (
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-600/30">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/[0.07] blur-lg" aria-hidden="true" />
            <BadgeDollarSign className="absolute -right-3 -bottom-3 w-24 h-24 text-white/[0.08] rotate-12" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
                  <BadgeDollarSign className="w-5 h-5 text-white" />
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-sm border ${
                  commission.unlocked
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-slate-900/25 border-white/20 text-white/70'
                }`}>
                  {commission.unlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {commission.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/90 mt-4">My Commission</div>
              <div className="text-[28px] leading-tight font-extrabold text-white mt-0.5 tracking-tight">
                {fmtUSD(commission.commission)}
              </div>
              {/* Mini progress */}
              <div className="mt-2.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/90 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-[11px] font-medium text-emerald-50/90">
                  {fmtUSD(commission.totalSales)} / {fmtUSD(commission.target)}
                </div>
                <div className="text-[10px] font-extrabold text-white/90">{pct}%</div>
              </div>
            </div>
          </div>
        )}

        {/* My Total Earning */}
        <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-5 shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/30`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/15 blur-xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/[0.08] blur-lg" aria-hidden="true" />
          <Coins className="absolute -right-3 -bottom-3 w-24 h-24 text-white/[0.1] -rotate-12" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white/20 border border-white/25 backdrop-blur-sm">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 border border-white/25 text-[9px] font-extrabold uppercase tracking-widest text-white/95 backdrop-blur-sm">
                {commission ? 'Salary + Commission' : 'Monthly'}
              </span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-100/95 mt-4">My Total Earning</div>
            <div className="text-[28px] leading-tight font-extrabold text-white mt-0.5 tracking-tight">
              {fmtUSD(totalEarning)}
            </div>
            {commission && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/20 text-[10px] font-bold text-white/95">
                  Salary {fmtUSD(salary || 0)}
                </span>
                <span className="text-white/60 text-[10px] font-bold">+</span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/20 text-[10px] font-bold text-white/95">
                  Commission {fmtUSD(commission.commission)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hours-based payable card */}
      {calc && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{monthName} Payable (by working hours)</h3>
                <p className="text-[11px] text-slate-500">
                  {calc.source === 'snapshot' ? 'Saved record · ' : ''}
                  {fmtHM(calc.workedMinutes)} worked{calc.otMinutes > 0 ? ` + ${fmtHM(calc.otMinutes)} OT` : ''}
                  {calc.paidLeaveDays > 0 ? ` · ${calc.paidLeaveDays} paid leave day(s)` : ''} of {fmtHM(calc.expectedMinutes)} expected ({calc.expectedDays ?? 30} days)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {calc.deduction > 0 && (
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Deduction</div>
                  <div className="text-sm font-extrabold text-rose-600">− {fmtHM(calc.shortfallMinutes)} · Rs {calc.deduction.toLocaleString('en-PK')}</div>
                </div>
              )}
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payable</div>
                <div className="text-2xl font-extrabold text-emerald-700">Rs {(calc.finalPayable ?? calc.payable).toLocaleString('en-PK')}</div>
                {calc.adjustments && calc.adjustments.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[8px] font-extrabold uppercase tracking-wide mt-0.5">
                    Manually adjusted
                  </span>
                )}
              </div>
            </div>
          </div>
          {calc.log.length > 0 && (
            <details className="mt-3 group">
              <summary className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer select-none">
                View hours log ({calc.log.length} entries)
              </summary>
              <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {calc.log.map((l, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    {l.type === '-' ? (
                      <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{l.date}</span>
                    <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">{l.reason}</span>
                    <span className={`text-[11px] font-extrabold font-mono shrink-0 ${l.type === '-' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {l.type === '-' ? '−' : '+'} Rs {l.amount.toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* No salary record for selected month */}
      {!calc && !isLoading && !error && (
        <div className="rounded-2xl bg-white/70 border border-dashed border-slate-300 p-6 text-center">
          <p className="text-xs font-semibold text-slate-500">No salary record for {monthName} yet.</p>
        </div>
      )}

      {/* Target progress (Sales only) */}
      {commission && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Monthly Target</h3>
                <p className="text-[11px] text-slate-500">
                  Target {fmtUSD(commission.target)} · extra ke 10% commission
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              commission.unlocked
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {commission.unlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {commission.unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 border border-slate-200/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
            <span>{fmtUSD(commission.totalSales)} earned</span>
            <span>{pct}% of target</span>
          </div>
        </div>
      )}

      {/* This month's sales (Sales only) */}
      {commission && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200/70">
            <BadgeDollarSign className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">This Month&apos;s Sales</h3>
            <span className="ml-auto text-[10px] font-bold text-slate-400">{sales.length} sale{sales.length === 1 ? '' : 's'}</span>
          </div>
          {isLoading && sales.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              No sales recorded yet this month.
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-200/70">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Recorded By</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{fmtDate(s.saleDate)}</td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-800">{s.clientName || '-'}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-500">{s.createdBy || '-'}</td>
                      <td className="px-5 py-3 text-right text-xs font-extrabold text-emerald-600 whitespace-nowrap">{fmtUSD(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!commission && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-6 text-center">
          <Wallet className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            Commission is only for the Sales team. Your earnings are based on salary alone.
          </p>
        </div>
      )}
    </div>
  );
};
