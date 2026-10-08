import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import { SaleRequest, fmtPKR } from '../../types/sales';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  BadgeDollarSign,
  Send,
} from 'lucide-react';

interface LeadSaleViewProps {
  user: User;
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

interface AgentOption {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
}

interface MonthSummary {
  month: string;
  pending: { total: number; count: number };
  approved: { total: number; count: number };
  rejected: { total: number; count: number };
}

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    Approved: { cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
    Rejected: { cls: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle className="w-3 h-3" /> },
  };
  const meta = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls}`}>
      {meta.icon} {status}
    </span>
  );
};

export const LeadSaleView: React.FC<LeadSaleViewProps> = ({ user, onNavigateToDashboard }) => {
  const [options, setOptions] = useState<AgentOption[]>([]);
  const [requests, setRequests] = useState<SaleRequest[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getHeaders();
      const [optionsRes, requestsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/sale-requests/options`, { headers }),
        fetch(`${API_BASE}/sale-requests`, { headers }),
        fetch(`${API_BASE}/sale-requests/summary`, { headers }),
      ]);
      if (optionsRes.ok) setOptions((await optionsRes.json()).options || []);
      if (requestsRes.ok) setRequests((await requestsRes.json()).requests || []);
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch {
      setError('Unable to load sales data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setEmployeeId('');
    setAmount('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientCompany('');
    setClientAddress('');
    setDescription('');
    setSaleDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!employeeId) {
      setFormError('Please select an employee.');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }
    if (!clientName.trim()) {
      setFormError('Client name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/sale-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          employeeId,
          amount: amt,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          clientCompany: clientCompany.trim(),
          clientAddress: clientAddress.trim(),
          saleDate: saleDate ? new Date(saleDate).toISOString() : undefined,
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Unable to submit request.');
      } else {
        setSuccessMsg('Sale request submitted. Sent to HR and Super Admin.');
        resetForm();
        fetchData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch {
      setFormError('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

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
              <BadgeDollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Sales & Earnings</h1>
              <p className="text-[11px] text-slate-500 font-medium">Report your team's sales. The request goes to HR and Super Admin</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              {pendingCount} pending
            </span>
          )}
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

      {/* This month's summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm px-4 py-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900">{fmtPKR(summary.pending.total)}</span>
                <span className="text-[10px] font-bold text-slate-400">{summary.pending.count} request{summary.pending.count === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm px-4 py-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900">{fmtPKR(summary.approved.total)}</span>
                <span className="text-[10px] font-bold text-slate-400">{summary.approved.count} request{summary.approved.count === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm px-4 py-3.5">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900">{fmtPKR(summary.rejected.total)}</span>
                <span className="text-[10px] font-bold text-slate-400">{summary.rejected.count} request{summary.rejected.count === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report a Sale Form */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Report a Sale</h3>
            <p className="text-[11px] text-slate-500">The employee shares the deal verbally, fill in the full details here</p>
          </div>
        </div>

        {formError && (
          <div className="mb-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5" /> {formError}
          </div>
        )}
        {successMsg && (
          <div className="mb-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee + Amount + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              >
                <option value="">Select employee…</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}, {o.jobTitle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Amount ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 450"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              />
            </div>
          </div>

          {/* Client Info */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Client Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Client Email</label>
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Client Phone</label>
                <input
                  type="tel"
                  placeholder="+92 ..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Client address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Deal Description</label>
                <textarea
                  rows={2}
                  placeholder="What was the deal? (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting…' : 'Submit Sale Request'}
            </button>
          </div>
        </form>
      </div>

      {/* My Requests */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200/70">
          <BadgeDollarSign className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">My Sale Requests</h3>
          <span className="ml-auto text-[10px] font-bold text-slate-400">{requests.length} total</span>
        </div>
        {isLoading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-xs font-semibold text-slate-500">
            No sale requests yet. Report your first sale above.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-200/70">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reviewed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{fmtDate(r.saleDate)}</td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-800">{r.employeeName}</td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-semibold text-slate-700">{r.clientName || '-'}</div>
                      {r.clientCompany && <div className="text-[10px] text-slate-400">{r.clientCompany}</div>}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-extrabold text-indigo-600 whitespace-nowrap">{fmtPKR(r.amount)}</td>
                    <td className="px-5 py-3"><StatusChip status={r.status} /></td>
                    <td className="px-5 py-3 text-[11px] font-semibold text-slate-500">
                      {r.reviewedBy ? `${r.reviewedBy}${r.reviewedByRole === 'HR_ADMIN' ? ' (HR)' : ''}` : '-'}
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
