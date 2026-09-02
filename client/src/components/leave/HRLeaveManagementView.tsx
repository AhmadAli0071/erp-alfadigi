import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../hr/StatusBadge';
import {
  CalendarDays,
  ArrowLeft,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface HRLeaveManagementViewProps {
  onNavigateToDashboard?: () => void;
  initialPreset?: string;
}

interface LeaveRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  jobTitle: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  leadApprovalNote?: string;
  leadApprovalDate?: string;
  hrApprovalNote?: string;
  createdAt: string;
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

const STATUS_OPTIONS = ['ALL', 'Approved', 'In Process', 'Final Approved', 'Rejected'];

export const HRLeaveManagementView: React.FC<HRLeaveManagementViewProps> = ({
  onNavigateToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<LeaveRecord | null>(null);
  const [actionNote, setActionNote] = useState('');

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/hr?status=${encodeURIComponent(selectedStatus)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch {
      setError('Unable to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = leaves.filter((l) =>
    !searchQuery ||
    l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    awaiting: leaves.filter((l) => l.status === 'Approved').length,
    inProcess: leaves.filter((l) => l.status === 'In Process').length,
    finalApproved: leaves.filter((l) => l.status === 'Final Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  const performAction = async (leaveId: string, action: 'hr-approve' | 'hr-reject' | 'hr-inprocess') => {
    setActionInProgress(leaveId);
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ note: actionNote }),
      });
      if (res.ok) {
        setDetailModal(null);
        setActionNote('');
        fetchLeaves();
      }
    } catch { /* ignore */ } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
              Leave Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">Lead-approved leave requests — final HR decision</p>
          </div>
        </div>
        <button
          onClick={fetchLeaves}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting HR', value: summary.awaiting, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'In Process', value: summary.inProcess, icon: <Loader2 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
          { label: 'Final Approved', value: summary.finalApproved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
          { label: 'Rejected', value: summary.rejected, icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
        ].map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {card.icon}
              <span className="text-xs font-medium text-slate-700">{card.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or leave type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'Awaiting HR Decision' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading leave requests…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchLeaves} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CalendarDays className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No leave requests</p>
          <p className="text-xs text-slate-400">Leaves approved by leads will appear here for final HR decision.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Days</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => { setDetailModal(leave); setActionNote(''); }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{leave.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{leave.employeeCode} · {leave.department}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.startDate} → {leave.endDate}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.totalDays}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={leave.status as 'Approved' | 'In Process' | 'Final Approved' | 'Rejected'} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      {leave.status === 'Approved' || leave.status === 'In Process' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => performAction(leave.id, 'hr-approve')}
                            disabled={actionInProgress === leave.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => performAction(leave.id, 'hr-inprocess')}
                            disabled={actionInProgress === leave.id || leave.status === 'In Process'}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                          >
                            In Process
                          </button>
                          <button
                            onClick={() => performAction(leave.id, 'hr-reject')}
                            disabled={actionInProgress === leave.id}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => setDetailModal(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailModal.employeeName}</h3>
                  <p className="text-[11px] text-slate-500">{detailModal.employeeCode} · {detailModal.department}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <AlertCircle className="hidden" />
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Leave Type</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{detailModal.leaveType}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Duration</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{detailModal.totalDays} day{detailModal.totalDays > 1 ? 's' : ''}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">From</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{detailModal.startDate}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">To</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{detailModal.endDate}</div>
                </div>
              </div>

              {detailModal.reason && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Reason</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{detailModal.reason}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-800">Lead Approved</span>
                  {detailModal.leadApprovalDate && (
                    <span className="text-[10px] text-emerald-600 ml-auto">{detailModal.leadApprovalDate}</span>
                  )}
                </div>
                {detailModal.leadApprovalNote && (
                  <p className="text-[11px] text-emerald-700 mt-1">{detailModal.leadApprovalNote}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">HR Note (optional)</label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note for this decision..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            {detailModal.status === 'Approved' || detailModal.status === 'In Process' ? (
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200/70">
                <button
                  onClick={() => performAction(detailModal.id, 'hr-reject')}
                  disabled={actionInProgress === detailModal.id}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Reject
                </button>
                <button
                  onClick={() => performAction(detailModal.id, 'hr-inprocess')}
                  disabled={actionInProgress === detailModal.id || detailModal.status === 'In Process'}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  In Process
                </button>
                <button
                  onClick={() => performAction(detailModal.id, 'hr-approve')}
                  disabled={actionInProgress === detailModal.id}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  {actionInProgress === detailModal.id ? 'Saving…' : 'Final Approve'}
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200/70 text-right">
                <StatusBadge status={detailModal.status as 'Final Approved' | 'Rejected'} size="xs" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
