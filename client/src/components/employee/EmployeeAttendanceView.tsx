import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { User } from '../../types/auth';
import {
  Clock,
  ArrowLeft,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileWarning,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { StatusBadge } from '../hr/StatusBadge';

interface EmployeeAttendanceViewProps {
  user: User;
  onNavigate: (route: string) => void;
  /** Route for the back arrow - HR reuses this view with its own dashboard. */
  backRoute?: string;
}

type ReviewStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workingMinutes: number;
  status: string;
  correctionStatus?: ReviewStatus;
  correctionReason?: string;
  correctionNote?: string;
  otStatus?: ReviewStatus;
  otReason?: string;
  otNote?: string;
  otApprovedMinutes?: number;
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

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

type RequestKind = 'correction' | 'ot';

export const EmployeeAttendanceView: React.FC<EmployeeAttendanceViewProps> = ({
  user,
  onNavigate,
  backRoute = '/employee/dashboard',
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // Request modal state
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const [requestRecord, setRequestRecord] = useState<AttendanceRecord | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/history/${user.email}?days=${days}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load attendance');
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      setError('Unable to load attendance history.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Live refresh: SSE notification ya window focus par history refetch
  useRealtimeRefresh(fetchHistory);

  const openRequestModal = (kind: RequestKind, record: AttendanceRecord) => {
    setRequestKind(kind);
    setRequestRecord(record);
    setReason('');
    setRequestError(null);
  };

  const closeRequestModal = () => {
    setRequestKind(null);
    setRequestRecord(null);
  };

  const submitRequest = async () => {
    if (!requestRecord || !requestKind) return;
    if (reason.trim().length < 5) {
      setRequestError('Please write a reason (at least 5 characters).');
      return;
    }
    setIsSubmitting(true);
    setRequestError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/${requestRecord.id}/${requestKind}-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setRequestError(data?.error || 'Could not submit the request.');
        return;
      }
      showToast(
        requestKind === 'correction'
          ? 'Correction request sent to HR.'
          : 'Overtime request sent to HR.'
      );
      closeRequestModal();
      await fetchHistory();
    } catch {
      setRequestError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    avgHours: records.length > 0
      ? formatMinutes(Math.round(records.reduce((a, r) => a + r.workingMinutes, 0) / records.length))
      : '00:00',
  };

  const pendingCorrections = records.filter((r) => r.correctionStatus === 'PENDING').length;
  const pendingOT = records.filter((r) => r.otStatus === 'PENDING').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border text-slate-900 text-xs shadow-2xl flex items-center gap-3 animate-scaleUp ${
            toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium text-slate-700">{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(backRoute)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-indigo-600" />
              My Attendance
            </h1>
            <p className="text-xs text-slate-500">Your attendance history, corrections and overtime requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs font-semibold text-slate-700 appearance-none cursor-pointer pr-8"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Days', value: summary.total, color: 'text-indigo-600' },
          { label: 'Present', value: summary.present, color: 'text-emerald-600' },
          { label: 'Late', value: summary.late, color: 'text-amber-600' },
          { label: 'Avg Hours', value: summary.avgHours, color: 'text-slate-900' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm text-center">
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending review banner */}
      {(pendingCorrections > 0 || pendingOT > 0) && (
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">
            Awaiting HR review:{' '}
            {pendingCorrections > 0 && <span>{pendingCorrections} correction{pendingCorrections === 1 ? '' : 's'}</span>}
            {pendingCorrections > 0 && pendingOT > 0 && <span> • </span>}
            {pendingOT > 0 && <span>{pendingOT} overtime request{pendingOT === 1 ? '' : 's'}</span>}
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading attendance…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchHistory} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
            Try again
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No attendance records</p>
          <p className="text-xs text-slate-500 mt-1">Your attendance history will appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Clock In</th>
                  <th className="py-3 px-3">Clock Out</th>
                  <th className="py-3 px-3">Working</th>
                  <th className="py-3 px-3">Break</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right pr-4">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {records.map((rec) => {
                  const correctionPending = rec.correctionStatus === 'PENDING';
                  const otPending = rec.otStatus === 'PENDING';
                  const canRequestCorrection = !correctionPending;
                  const canRequestOT = !!rec.clockIn && !otPending;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{rec.date}</td>
                      <td className="py-3.5 px-3 text-xs text-slate-600">{rec.clockIn || '-'}</td>
                      <td className="py-3.5 px-3 text-xs text-slate-600">{rec.clockOut || '-'}</td>
                      <td className="py-3.5 px-3 text-xs font-semibold text-slate-700">{formatMinutes(rec.workingMinutes)}</td>
                      <td className="py-3.5 px-3 text-xs text-slate-500">{rec.breakMinutes} min</td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={rec.status as 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'} size="xs" />
                      </td>
                      <td className="py-3.5 px-4 text-right pr-4">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          {/* Correction state / action */}
                          {correctionPending ? (
                            <span
                              title={`Reason: ${rec.correctionReason || '-'}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold"
                            >
                              <FileWarning className="w-3 h-3" />
                              Correction Pending
                            </span>
                          ) : rec.correctionStatus === 'APPROVED' ? (
                            <span
                              title={rec.correctionNote || 'Correction resolved by HR'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Fixed
                            </span>
                          ) : rec.correctionStatus === 'REJECTED' ? (
                            <span
                              title={rec.correctionNote || 'Correction rejected by HR'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-500 text-[10px] font-bold"
                            >
                              <XCircle className="w-3 h-3" />
                              Fix Rejected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openRequestModal('correction', rec)}
                              title="Request a correction for this day"
                              className="px-2 py-1 rounded-lg bg-slate-100/50 hover:bg-amber-500 hover:text-white text-amber-600 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileWarning className="w-3 h-3" />
                              Fix
                            </button>
                          )}

                          {/* OT state / action */}
                          {otPending ? (
                            <span
                              title={`Reason: ${rec.otReason || '-'}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold"
                            >
                              <Loader2 className="w-3 h-3 animate-pulse" />
                              OT Pending
                            </span>
                          ) : rec.otStatus === 'APPROVED' ? (
                            <span
                              title={rec.otNote || 'Overtime approved'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold"
                            >
                              <Sparkles className="w-3 h-3" />
                              OT +{formatMinutes(rec.otApprovedMinutes || 0)}
                            </span>
                          ) : rec.otStatus === 'REJECTED' ? (
                            <span
                              title={rec.otNote || 'Overtime rejected'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-500 text-[10px] font-bold"
                            >
                              <XCircle className="w-3 h-3" />
                              OT Rejected
                            </span>
                          ) : canRequestOT ? (
                            <button
                              type="button"
                              onClick={() => openRequestModal('ot', rec)}
                              title="Request overtime approval for this day"
                              className="px-2 py-1 rounded-lg bg-slate-100/50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              OT
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request modal (correction / OT) */}
      {requestKind && requestRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={closeRequestModal} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl p-6 z-10 animate-scaleUp text-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  requestKind === 'correction'
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}
              >
                {requestKind === 'correction' ? <FileWarning className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {requestKind === 'correction' ? 'Request Attendance Correction' : 'Request Overtime Approval'}
                </h3>
                <p className="text-xs text-slate-500">
                  {requestRecord.date} • {requestRecord.clockIn || 'No clock-in'} – {requestRecord.clockOut || 'No clock-out'}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {requestKind === 'correction' ? 'What needs fixing?' : 'Why was overtime needed?'}
              </span>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  requestKind === 'correction'
                    ? 'e.g., Forgot to clock in, I arrived at 6:05 PM'
                    : 'e.g., Stayed until 5 AM to finish the client deployment'
                }
                className="w-full mt-1 text-xs p-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                autoFocus
              />
            </label>

            {requestError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {requestError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeRequestModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRequest}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Sending...' : 'Send to HR'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
