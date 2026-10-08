import React, { useState, useEffect, useCallback } from 'react';
import { Sale, SaleRequest, CommissionRow, currentMonthKey, fmtPKR } from '../../types/sales';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  BadgeDollarSign,
  Plus,
  Trash2,
  Target,
  Lock,
  Unlock,
  CalendarDays,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface SuperAdminSalesViewProps {
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

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const SuperAdminSalesView: React.FC<SuperAdminSalesViewProps> = ({ onNavigateToDashboard }) => {
  const [month, setMonth] = useState(currentMonthKey());
  const [summary, setSummary] = useState<CommissionRow[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [requests, setRequests] = useState<SaleRequest[]>([]);
  const [reqStatusFilter, setReqStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add-sale form
  const [formEmployee, setFormEmployee] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getHeaders();
      const [commRes, salesRes, reqRes] = await Promise.all([
        fetch(`${API_BASE}/sales/commission?month=${month}`, { headers }),
        fetch(`${API_BASE}/sales?month=${month}`, { headers }),
        fetch(`${API_BASE}/sale-requests`, { headers }),
      ]);
      if (commRes.ok) setSummary((await commRes.json()).summary || []);
      if (salesRes.ok) setSales((await salesRes.json()).sales || []);
      if (reqRes.ok) setRequests((await reqRes.json()).requests || []);
    } catch {
      setError('Unable to load sales & commission data.');
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmployee) {
      setFormError('Select a sales person.');
      return;
    }
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      setFormError('Enter a valid sale amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          employeeId: formEmployee,
          amount,
          clientName: formClient.trim(),
          description: formDescription.trim(),
          saleDate: formDate ? new Date(formDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Unable to record sale.');
      } else {
        setFormAmount('');
        setFormClient('');
        setFormDescription('');
        fetchData();
      }
    } catch {
      setFormError('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (!window.confirm(`Delete this ${fmtPKR(sale.amount)} sale for ${sale.employeeName}?`)) return;
    setBusyId(sale.id);
    try {
      const res = await fetch(`${API_BASE}/sales/${sale.id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        setSales((prev) => prev.filter((s) => s.id !== sale.id));
        fetchData();
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const handleReviewRequest = async (req: SaleRequest, action: 'approve' | 'reject') => {
    setBusyId(req.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sale-requests/${req.id}/${action}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Unable to ${action} request.`);
      } else {
        fetchData();
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <BadgeDollarSign className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Sales & Commissions</h1>
              <p className="text-[11px] text-slate-500 font-medium">Record sales and track monthly commissions</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || currentMonthKey())}
              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-400/10 border border-rose-400/20 text-xs font-bold text-rose-300">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Sale Requests (from Sales leads) */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sale Requests</h3>
              <p className="text-[11px] text-slate-500">Requests from sales leads. HR or you, whoever approves first</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-1.5">
            {(['Pending', 'Approved', 'Rejected'] as const).map((s) => {
              const count = requests.filter((r) => r.status === s).length;
              const active = reqStatusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReqStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {(() => {
          const filtered = requests.filter((r) => r.status === reqStatusFilter);
          if (isLoading && requests.length === 0) {
            return (
              <div className="flex items-center justify-center py-14">
                <RefreshCw className="w-5 h-5 text-amber-300/60 animate-spin" />
              </div>
            );
          }
          if (filtered.length === 0) {
            return (
              <div className="py-10 text-center text-xs font-semibold text-slate-600">
                No {reqStatusFilter.toLowerCase()} sale requests.
              </div>
            );
          }
          return (
            <div className="divide-y divide-white/[0.05]">
              {filtered.map((r) => (
                <div key={r.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Employee + amount */}
                    <div className="lg:w-56 shrink-0 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-extrabold flex items-center justify-center">
                          {r.employeeName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{r.employeeName}</div>
                          <div className="text-[10px] font-medium text-slate-500 truncate">{fmtDate(r.saleDate)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-extrabold text-amber-300">{fmtPKR(r.amount)}</div>
                      <div className="flex items-center gap-2">
                        {r.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {r.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {r.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-400/10 text-rose-300 border border-rose-400/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Client details - SA only */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 min-w-0">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Client</div>
                        <div className="text-xs font-bold text-slate-200 truncate">{r.clientName || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Company</div>
                        <div className="text-xs font-semibold text-slate-300 truncate">{r.clientCompany || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Email</div>
                        <div className="text-xs font-semibold text-slate-300 truncate">{r.clientEmail || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Phone</div>
                        <div className="text-xs font-semibold text-slate-300 truncate">{r.clientPhone || '-'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Address</div>
                        <div className="text-xs font-semibold text-slate-300 truncate">{r.clientAddress || '-'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Description</div>
                        <div className="text-xs font-medium text-slate-400">{r.description || '-'}</div>
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <UserIcon className="w-3 h-3" />
                        Requested by <span className="text-slate-300 font-bold">{r.requestedByName}</span>
                        {r.reviewedBy && (
                          <span className="ml-2">
                            · {r.status} by <span className="text-slate-300 font-bold">{r.reviewedBy}</span>
                            {r.reviewedByRole === 'HR_ADMIN' ? ' (HR)' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {r.status === 'Pending' && (
                      <div className="lg:w-32 shrink-0 flex lg:flex-col gap-2 lg:justify-center">
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(r, 'approve')}
                          disabled={busyId === r.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold hover:bg-emerald-400/25 transition-all disabled:opacity-40 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(r, 'reject')}
                          disabled={busyId === r.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-300 text-[11px] font-bold hover:bg-rose-400/10 hover:text-rose-300 hover:border-rose-400/30 transition-all disabled:opacity-40 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Add Sale Form */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Record a Sale</h3>
            <p className="text-[11px] text-slate-500">Commission is auto-calculated for every sale entry</p>
          </div>
        </div>

        {formError && (
          <div className="mb-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-400/10 border border-rose-400/20 text-xs font-bold text-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> {formError}
          </div>
        )}

        <form onSubmit={handleAddSale} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Sales Person</label>
            <select
              value={formEmployee}
              onChange={(e) => setFormEmployee(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-bold text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/40"
            >
              <option value="" className="bg-[#0C0C13]">Select person…</option>
              {summary.map((p) => (
                <option key={p.employeeId} value={p.employeeId} className="bg-[#0C0C13]">
                  {p.name} ({p.role === 'DEPARTMENT_LEAD' ? 'Lead' : 'Agent'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 250"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Client</label>
            <input
              type="text"
              placeholder="Client name"
              value={formClient}
              onChange={(e) => setFormClient(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/40 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Saving…' : 'Add Sale'}
            </button>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <input
              type="text"
              placeholder="Description (optional, what was sold)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/40"
            />
          </div>
        </form>
      </div>

      {/* Commission Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Commission Summary, {monthLabel(month)}</h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent PKR 500 · Lead PKR 3000 · 10% of extra</span>
        </div>
        {isLoading && summary.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : summary.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-10 text-center text-xs font-semibold text-slate-500">
            No active Sales department members.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {summary.map((p) => {
              const pct = p.target > 0 ? Math.min(100, Math.round((p.totalSales / p.target) * 100)) : 0;
              return (
                <div key={p.employeeId} className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] hover:border-white/[0.12] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.jobTitle}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border ${
                      p.unlocked
                        ? 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                        : 'bg-white/[0.04] text-slate-500 border-white/[0.08]'
                    }`}>
                      {p.unlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      {p.role === 'DEPARTMENT_LEAD' ? 'Lead' : 'Agent'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-white leading-none">{fmtPKR(p.totalSales)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{p.salesCount} sales · target {fmtPKR(p.target)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-extrabold leading-none ${p.commission > 0 ? 'text-amber-300' : 'text-slate-600'}`}>
                        {fmtPKR(p.commission)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">commission</div>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        p.unlocked
                          ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {p.unlocked ? `Unlocked, ${fmtPKR(p.extraAmount)} extra at ${p.rate * 100}%` : `${pct}% of target, locked`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <Target className="w-4 h-4 text-amber-300" />
          <h3 className="text-sm font-bold text-white">Sales Entries, {monthLabel(month)}</h3>
          <span className="ml-auto text-[10px] font-bold text-slate-500">{sales.length} entries</span>
        </div>
        {isLoading && sales.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-amber-300/80 animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-10 text-center text-xs font-semibold text-slate-500">
            No sales recorded for {monthLabel(month)}.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/[0.02] border-b border-white/[0.06]">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Sales Person</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5">Added By</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-400 whitespace-nowrap">{fmtDate(s.saleDate)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3 h-3 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{s.employeeName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{s.employeeEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-300">{s.clientName || '-'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[220px] truncate">{s.description || '-'}</td>
                    <td className="px-5 py-3.5 text-right text-xs font-extrabold text-amber-300 whitespace-nowrap">{fmtPKR(s.amount)}</td>
                    <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-500">{s.createdBy || '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => handleDeleteSale(s)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-rose-300 hover:border-rose-400/30 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
