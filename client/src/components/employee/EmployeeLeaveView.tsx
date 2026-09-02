import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  CalendarDays,
  ArrowLeft,
  ChevronDown,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '../hr/StatusBadge';

interface EmployeeLeaveViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Unpaid Leave', 'Maternity / Paternity', 'Bereavement Leave', 'Special / Other Leave'];
const STATUS_OPTIONS = ['ALL', 'Pending', 'Approved', 'Rejected'];

interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
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

export const EmployeeLeaveView: React.FC<EmployeeLeaveViewProps> = ({
  user,
  onNavigate,
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/my/${user.email}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch {
      setError('Unable to load leave history.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = selectedStatus === 'ALL' ? leaves : leaves.filter((l) => l.status === selectedStatus);

  const summary = {
    pending: leaves.filter((l) => l.status === 'Pending').length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
    total: leaves.length,
  };

  const calculateDays = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!leaveType || !startDate || !endDate) {
      setSubmitError('Please fill all required fields.');
      return;
    }
    if (calculateDays() <= 0) {
      setSubmitError('End date must be same or after start date.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          employeeEmail: user.email,
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit request.');
        return;
      }
      setShowRequestForm(false);
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch {
      setSubmitError('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/employee/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Leaves</h1>
            <p className="text-xs text-slate-500 font-medium">Leave requests and history</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestForm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Request Leave</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: summary.pending, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'Approved', value: summary.approved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
          { label: 'Rejected', value: summary.rejected, icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
          { label: 'Total Requests', value: summary.total, icon: <CalendarDays className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-500/[0.04] border-indigo-200' },
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

      {/* Filter */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={fetchLeaves}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leave History */}
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
          <p className="text-xs text-slate-400">You haven't submitted any leave requests yet.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">From</th>
                  <th className="px-5 py-3.5">To</th>
                  <th className="px-5 py-3.5">Days</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right pr-5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.startDate}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.endDate}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.totalDays}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={leave.status as 'Pending' | 'Approved' | 'Rejected'} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 text-right pr-5">
                      {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Flow Info */}
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-200 shrink-0">
          <FileText className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-900 mb-0.5">Approval Workflow</p>
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            Leave requests follow: Employee → Lead → HR. You can track the status of your request at each step.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {['Submitted', 'Lead Review', 'HR Review', 'Final Decision'].map((step, idx) => (
              <React.Fragment key={step}>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{step}</span>
                {idx < 3 && <span className="text-indigo-300 text-xs">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => { setShowRequestForm(false); setSubmitError(null); }} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Leave</h3>
                  <p className="text-[11px] text-slate-500">Submit a new leave request</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowRequestForm(false); setSubmitError(null); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-700 font-medium">{submitError}</p>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Type *</label>
                <div className="relative">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">Select leave type</option>
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">From *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">To *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
              </div>

              {calculateDays() > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-xs font-bold text-indigo-700">Duration: {calculateDays()} day{calculateDays() > 1 ? 's' : ''}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for leave..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            {/* Approval Flow */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
              <p className="text-[11px] text-indigo-700 font-medium">
                <span className="font-bold">Approval flow:</span> Employee → Lead → HR
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={() => { setShowRequestForm(false); setSubmitError(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
