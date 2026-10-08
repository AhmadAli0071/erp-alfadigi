import React, { useState, useEffect, useCallback } from 'react';
import { SaleRequest, EarningsRow, currentMonthKey, fmtPKR } from '../../types/sales';
import {
  BadgeDollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  XCircle,
} from 'lucide-react';

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
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

interface HREarningsUpdateProps {
  onActionComplete?: (message: string) => void;
}

export const HREarningsUpdate: React.FC<HREarningsUpdateProps> = ({ onActionComplete }) => {
  const [pendingRequests, setPendingRequests] = useState<SaleRequest[]>([]);
  const [earnings, setEarnings] = useState<EarningsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add earning form
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getHeaders();
      const [reqRes, earnRes] = await Promise.all([
        fetch(`${API_BASE}/sale-requests?status=Pending`, { headers }),
        fetch(`${API_BASE}/sales/earnings?month=${currentMonthKey()}`, { headers }),
      ]);
      if (reqRes.ok) setPendingRequests((await reqRes.json()).requests || []);
      if (earnRes.ok) setEarnings((await earnRes.json()).earnings || []);
    } catch {
      setError('Unable to load earnings data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reviewRequest = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sale-requests/${id}/${action}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Unable to ${action} request.`);
      } else {
        onActionComplete?.(action === 'approve' ? 'Sale request approved. Earning updated.' : 'Sale request rejected.');
        fetchData();
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addEmployeeId) {
      setAddError('Please select an employee.');
      return;
    }
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) {
      setAddError('Enter a valid amount.');
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeId: addEmployeeId, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Unable to add earning.');
      } else {
        onActionComplete?.('Earning added. Super Admin has been notified.');
        setAddEmployeeId('');
        setAddAmount('');
        fetchData();
      }
    } catch {
      setAddError('Unable to connect to server.');
    } finally {
      setIsAdding(false);
    }
  };

  const totalEarnings = earnings.reduce((s, e) => s + e.totalSales, 0);

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200/70">
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
          <BadgeDollarSign className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Earnings Update</h3>
          <p className="text-[11px] text-slate-500">Sales team monthly earnings, approve requests or add directly</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="ml-auto p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors disabled:opacity-40 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Pending Sale Requests - limited info only */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Sale Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px]">
                  {pendingRequests.length}
                </span>
              )}
            </span>
          </div>
          {isLoading && pendingRequests.length === 0 ? (
            <div className="py-6 text-center text-xs font-semibold text-slate-400">Loading…</div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-6 text-center text-xs font-semibold text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              No pending sale requests
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200/70"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{r.employeeName}</span>
                      <span className="text-xs font-extrabold text-emerald-600">{fmtPKR(r.amount)}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Reported by {r.requestedByName} · {fmtDate(r.saleDate || r.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => reviewRequest(r.id, 'approve')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewRequest(r.id, 'reject')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Earning (direct) */}
        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Add Earning Directly</span>
          </div>
          {addError && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600">
              <AlertCircle className="w-3 h-3" /> {addError}
            </div>
          )}
          <form onSubmit={handleAddEarning} className="flex flex-col sm:flex-row gap-2">
            <select
              value={addEmployeeId}
              onChange={(e) => setAddEmployeeId(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
            >
              <option value="">Select sales employee…</option>
              {earnings.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>{e.name}, {e.jobTitle}</option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount ($)"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full sm:w-36 px-3 py-2.5 rounded-xl bg-white border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdding ? 'Adding…' : 'Add'}
            </button>
          </form>
          <p className="mt-2 text-[10px] font-medium text-slate-400">
            Counts immediately. An audit notification is sent to Super Admin.
          </p>
        </div>

        {/* Monthly earnings summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">This Month&apos;s Earnings</span>
            <span className="text-[11px] font-extrabold text-emerald-600">{fmtPKR(totalEarnings)} total</span>
          </div>
          {earnings.length === 0 ? (
            <div className="py-4 text-center text-xs font-semibold text-slate-400">No sales employees found</div>
          ) : (
            <div className="space-y-1.5">
              {earnings.map((e) => (
                <div key={e.employeeId} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {e.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{e.name}</div>
                    <div className="text-[10px] font-medium text-slate-400">{e.jobTitle}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-slate-800">{fmtPKR(e.totalSales)}</div>
                    <div className="text-[10px] font-medium text-slate-400">{e.salesCount} sale{e.salesCount === 1 ? '' : 's'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
