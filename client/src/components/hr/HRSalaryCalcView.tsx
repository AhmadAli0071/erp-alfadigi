import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  MinusCircle,
  PlusCircle,
  Activity,
  IndianRupee,
  Wallet,
  Clock,
  SlidersHorizontal,
  Trash2,
  BadgeCheck,
  KeyRound,
  X,
} from 'lucide-react';

interface LogEntry {
  date: string;
  type: '-' | '+';
  reason: string;
  minutes: number;
  amount: number;
}

interface Adjustment {
  id: string;
  type: 'bonus' | 'deduction' | 'override';
  amount: number;
  reason: string;
  byName: string;
  createdAt: string;
}

interface SalaryRow {
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
  adjustments: Adjustment[];
  log: LogEntry[];
  source: 'live' | 'snapshot';
}

interface MonthResponse {
  month: string;
  source: 'live' | 'snapshot';
  requiredHoursPerDay: number;
  rows: SalaryRow[];
  deptTotals: Record<string, { payable: number; deduction: number; base: number }>;
  grandTotal: { base: number; payable: number; deduction: number };
}

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const rs = (n: number): string => `PKR ${Math.round(n).toLocaleString('en-PK')}`;
const fmtH = (mins: number): string => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
const currentMonth = (): string => {
  const d = new Date(Date.now() + 5 * 60 * 60000);
  return d.toISOString().slice(0, 7);
};
const DEPTS = ['Tech', 'Sales', 'HR'];

export const HRSalaryCalcView: React.FC<{ onNavigateToDashboard: () => void }> = ({ onNavigateToDashboard }) => {
  const [month, setMonth] = useState(currentMonth());
  const [dept, setDept] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<MonthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [adjustFor, setAdjustFor] = useState<SalaryRow | null>(null);
  const [baseFor, setBaseFor] = useState<SalaryRow | null>(null);

  const saveAdjustment = async (employeeId: string, type: 'bonus' | 'deduction' | 'override', amount: number, reason: string) => {
    const res = await fetch('/api/salary-calc/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ month, employeeId, type, amount, reason }),
    });
    const body = await res.json().catch(() => ({}));
    setToast(res.ok ? { ok: true, text: `${type[0].toUpperCase() + type.slice(1)} of PKR ${amount.toLocaleString('en-PK')} saved.` } : { ok: false, text: body.error || 'Adjustment failed.' });
    setTimeout(() => setToast(null), 5000);
    if (res.ok) fetchCalc();
    return res.ok;
  };

  const deleteAdjustment = async (id: string) => {
    const res = await fetch(`/api/salary-calc/adjust/${id}`, { method: 'DELETE', headers: getHeaders() });
    setToast(res.ok ? { ok: true, text: 'Adjustment removed.' } : { ok: false, text: 'Remove failed.' });
    setTimeout(() => setToast(null), 4000);
    if (res.ok) fetchCalc();
  };

  const updateBaseSalary = async (employeeId: string, newSalary: number, reason: string) => {
    const res = await fetch(`/api/salary-calc/base/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ newSalary, reason }),
    });
    const body = await res.json().catch(() => ({}));
    setToast(res.ok ? { ok: true, text: `Base salary updated to PKR ${newSalary.toLocaleString('en-PK')}.` } : { ok: false, text: body.error || 'Update failed.' });
    setTimeout(() => setToast(null), 5000);
    if (res.ok) fetchCalc();
    return res.ok;
  };

  const fetchCalc = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/salary-calc/month?month=${month}${dept ? `&department=${dept}` : ''}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('failed');
      setData(await res.json());
    } catch {
      setError('Unable to load salary calculation.');
    } finally {
      setIsLoading(false);
    }
  }, [month, dept]);

  useEffect(() => {
    setIsLoading(true);
    fetchCalc();
  }, [fetchCalc]);

  useRealtimeRefresh(fetchCalc);
  useEffect(() => {
    const t = setInterval(fetchCalc, 30000);
    return () => clearInterval(t);
  }, [fetchCalc]);

  // Server already counts open-shift minutes as live; refetch (SSE + 30s) keeps this fresh.
  const liveMinutesFor = (r: SalaryRow): number => r.workedMinutes;

  const rows = useMemo(() => {
    if (!data) return [];
    return data.rows.filter(
      (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.empId.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totals = data
    ? {
        base: rows.reduce((n, r) => n + r.baseSalary, 0),
        payable: rows.reduce((n, r) => n + r.payable, 0),
        deduction: rows.reduce((n, r) => n + r.deduction, 0),
      }
    : { base: 0, payable: 0, deduction: 0 };

  const exportCsv = async () => {
    const res = await fetch(`/api/salary-calc/month/export?month=${month}${dept ? `&department=${dept}` : ''}`, { headers: getHeaders() });
    if (!res.ok) {
      setToast({ ok: false, text: 'Export failed.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-calc-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lockMonth = async () => {
    const res = await fetch(`/api/salary-calc/lock/${month}`, { method: 'POST', headers: getHeaders() });
    const body = await res.json().catch(() => ({}));
    setToast(res.ok ? { ok: true, text: `Month ${month} locked to history (${body.employees ?? 0} employees).` } : { ok: false, text: body.error || 'Lock failed.' });
    setTimeout(() => setToast(null), 5000);
    if (res.ok) fetchCalc();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Salary Calculation</h1>
          <p className="text-xs text-slate-500 font-medium">Working-hours based payroll · 30-day basis · live updates</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer"
          />
          {data && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-extrabold uppercase tracking-widest ${
              data.source === 'live' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              {data.source === 'live' ? <><Activity className="w-3 h-3" /> Live</> : <><Lock className="w-3 h-3" /> Saved History</>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dept</label>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="">All</option>
            {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <div className="flex items-center gap-2">
          <button onClick={fetchCalc} disabled={isLoading} className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={lockMonth} title="Save this month to permanent history" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold transition-colors cursor-pointer">
            <Lock className="w-3.5 h-3.5" /> Lock Month
          </button>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {toast.text}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Base</div>
            <div className="text-lg font-extrabold text-slate-900">{rs(totals.base)}</div>
          </div>
          <Wallet className="w-5 h-5 text-slate-400" />
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Payable</div>
            <div className="text-lg font-extrabold text-emerald-700">{rs(totals.payable)}</div>
          </div>
          <IndianRupee className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Deduction</div>
            <div className="text-lg font-extrabold text-rose-600">{rs(totals.deduction)}</div>
          </div>
          <MinusCircle className="w-5 h-5 text-rose-400" />
        </div>
      </div>

      {/* Table */}
      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : error && !data ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchCalc} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Per Day</th>
                  <th className="px-4 py-3">Worked + OT</th>
                  <th className="px-4 py-3">Paid Leave</th>
                  <th className="px-4 py-3">Shortfall</th>
                  <th className="px-4 py-3">Deduction</th>
                  <th className="px-4 py-3 text-right">Payable</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-xs text-slate-400 font-medium">No employees found.</td></tr>
                )}
                {rows.map((r) => (
                  <React.Fragment key={r.employeeId}>
                    <tr className={`transition-colors ${expanded === r.employeeId ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-800">{r.name}</div>
                        <div className="text-[10px] text-slate-500">{r.empId} · {r.department} · {r.jobTitle}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{rs(r.baseSalary)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{rs(r.perDayRate)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                        {fmtH(liveMinutesFor(r))}
                        {r.otMinutes > 0 && <span className="ml-1 text-[9px] font-bold text-emerald-600">+{fmtH(r.otMinutes)} OT</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{r.paidLeaveDays}d</td>
                      <td className="px-4 py-3 text-xs font-semibold text-rose-600">{r.shortfallMinutes > 0 ? fmtH(r.shortfallMinutes) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-rose-600">{r.deduction > 0 ? `− ${rs(r.deduction)}` : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs font-extrabold text-emerald-700">{rs(r.finalPayable)}</div>
                        {r.adjustments.length > 0 && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[8px] font-extrabold uppercase tracking-wide">
                            <SlidersHorizontal className="w-2.5 h-2.5" /> Adjusted
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAdjustFor(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Manual adjustment"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBaseFor(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                            title="Edit base salary (request)"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpanded(expanded === r.employeeId ? null : r.employeeId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Deduction log"
                          >
                            {expanded === r.employeeId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === r.employeeId && (
                      <tr>
                        <td colSpan={9} className="px-4 pb-4 bg-indigo-50/40">
                          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3.5">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Deduction & Credit Log — {r.name}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                Expected {fmtH(r.expectedMinutes)} ({r.expectedDays} days) · Counted {fmtH(r.countableMinutes)}
                              </span>
                            </div>
                            {r.log.length === 0 ? (
                              <div className="py-4 text-center text-xs font-semibold text-emerald-600">Full attendance — no deductions this month.</div>
                            ) : (
                              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                {r.log.map((l, i) => {
                                  const manual = l.reason.startsWith('[Manual]');
                                  return (
                                    <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${manual ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/60 border-slate-100'}`}>
                                      {l.type === '-' ? (
                                        <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      ) : (
                                        <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      )}
                                      <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{l.date}</span>
                                      <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">{l.reason}</span>
                                      {l.minutes > 0 && <span className="text-[10px] font-bold text-slate-400 shrink-0">{fmtH(l.minutes)}</span>}
                                      <span className={`text-[11px] font-extrabold font-mono shrink-0 ${l.type === '-' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {l.type === '-' ? '−' : '+'} {rs(l.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium justify-center">
        <Activity className="w-3 h-3" /> Salary = Base × (counted ÷ expected) · Expected = 30 × {data?.requiredHoursPerDay ?? 9}h · Live updates every 30s
      </div>

      {adjustFor && (
        <AdjustModal
          row={adjustFor}
          month={month}
          onClose={() => setAdjustFor(null)}
          onSave={saveAdjustment}
          onDelete={deleteAdjustment}
        />
      )}
      {baseFor && (
        <BaseEditModal
          row={baseFor}
          onClose={() => setBaseFor(null)}
          onSubmit={updateBaseSalary}
        />
      )}
    </div>
  );
};

/* ---------------- Modals ---------------- */

const AdjustModal: React.FC<{
  row: SalaryRow;
  month: string;
  onClose: () => void;
  onSave: (employeeId: string, type: 'bonus' | 'deduction' | 'override', amount: number, reason: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}> = ({ row, month, onClose, onSave, onDelete }) => {
  const [type, setType] = useState<'bonus' | 'deduction' | 'override'>('bonus');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    setBusy(true);
    const ok = await onSave(row.employeeId, type, amt, reason.trim());
    setBusy(false);
    if (ok) {
      setAmount('');
      setReason('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Manual Adjustment
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">{row.name} · {row.empId} · {month}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 py-3.5 space-y-3.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-[9px] font-bold uppercase text-slate-400">Calculated</div>
              <div className="font-extrabold text-slate-800">{rs(row.payable)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[9px] font-bold uppercase text-emerald-600">Current Final</div>
              <div className="font-extrabold text-emerald-700">{rs(row.finalPayable)}</div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {([
                { k: 'bonus' as const, label: 'Bonus', cls: 'bg-emerald-600' },
                { k: 'deduction' as const, label: 'Deduction', cls: 'bg-rose-600' },
                { k: 'override' as const, label: 'Override', cls: 'bg-slate-900' },
              ]).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setType(t.k)}
                  className={`py-2 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${type === t.k ? `${t.cls} text-white shadow-lg` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {type === 'override' ? 'Final Payable Amount (PKR)' : 'Amount (PKR)'}
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason (required)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Extra project bonus / Late penalty"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <button
            onClick={submit}
            disabled={busy || !amount || !reason.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            {busy ? 'Saving…' : `Save ${type}`}
          </button>

          {row.adjustments.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Applied adjustments</div>
              <div className="space-y-1.5">
                {row.adjustments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2">
                    <BadgeCheck className={`w-3.5 h-3.5 shrink-0 ${a.type === 'bonus' ? 'text-emerald-500' : a.type === 'deduction' ? 'text-rose-500' : 'text-slate-700'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-700 capitalize">{a.type} · PKR {a.amount.toLocaleString('en-PK')}</div>
                      <div className="text-[9px] text-slate-400 truncate">{a.reason || 'No reason'} — {a.byName}</div>
                    </div>
                    <button onClick={() => onDelete(a.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const BaseEditModal: React.FC<{
  row: SalaryRow;
  onClose: () => void;
  onSubmit: (employeeId: string, newSalary: number, reason: string) => Promise<boolean>;
}> = ({ row, onClose, onSubmit }) => {
  const [newSalary, setNewSalary] = useState(String(row.baseSalary));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(newSalary);
    if (!Number.isFinite(amt) || amt < 0 || amt === row.baseSalary || !reason.trim()) return;
    setBusy(true);
    const ok = await onSubmit(row.employeeId, amt, reason.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" /> Edit Base Salary
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">{row.name} · {row.empId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3.5 space-y-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current</label>
            <div className="text-sm font-extrabold text-slate-800">{rs(row.baseSalary)}</div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New Salary (PKR)</label>
            <input
              type="number"
              min={0}
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason (required)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Promotion / correction"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button
            onClick={submit}
            disabled={busy || !reason.trim() || Number(newSalary) === row.baseSalary}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            {busy ? 'Updating…' : 'Update Base Salary'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
