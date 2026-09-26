import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { StatusBadge } from '../hr/StatusBadge';
import { leaveTypeService } from '../../services/leaveTypeService';
import { LeadLeaveDetailModal } from './LeadLeaveDetailModal';
import {
  CalendarDays,
  ArrowLeft,
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Users,
  User as UserIcon,
  Loader2,
  X,
  Eye,
} from 'lucide-react';

interface LeadLeaveViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
}

interface LeaveRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  leadApprovalDate?: string;
  leadApprovalNote?: string;
  hrApprovalDate?: string;
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

const postHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', ...getHeaders() });

const TEAM_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Status' },
  { value: 'Pending', label: 'Pending (Lead Approval)' },
  { value: 'Approved', label: 'Approved by Lead' },
  { value: 'Final Approved', label: 'Approved by HR' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];
const MY_STATUS_OPTIONS = ['ALL', 'Pending', 'Approved', 'In Process', 'Final Approved', 'Rejected', 'Cancelled'];

const FALLBACK_LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Unpaid Leave', 'Maternity / Paternity', 'Bereavement Leave', 'Special / Other Leave'];

const myStatusChip = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Approved':
    case 'In Process':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Final Approved':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

export const LeadLeaveView: React.FC<LeadLeaveViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [viewTab, setViewTab] = useState<'team' | 'my'>('team');

  // Team state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [detailLeave, setDetailLeave] = useState<LeaveRecord | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // My requests state
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [myIsLoading, setMyIsLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [mySelectedStatus, setMySelectedStatus] = useState('ALL');
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Request form state
  const [leaveTypes, setLeaveTypes] = useState<string[]>(FALLBACK_LEAVE_TYPES);
  const [noLeadApprovalTypes, setNoLeadApprovalTypes] = useState<string[]>([]);
  const [formLeaveType, setFormLeaveType] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/team/${user.email}?status=${selectedStatus}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch {
      setError('Unable to load leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email, selectedStatus]);

  const fetchMyLeaves = useCallback(async () => {
    setMyIsLoading(true);
    setMyError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves/my/${user.email}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMyLeaves(data.leaves || []);
    } catch {
      setMyError('Unable to load your leave requests.');
    } finally {
      setMyIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    if (viewTab === 'team') {
      fetchLeaves();
    } else {
      fetchMyLeaves();
    }
  }, [viewTab, fetchLeaves, fetchMyLeaves]);

  // Live refresh: SSE notification ya window focus par active tab refetch
  useRealtimeRefresh(viewTab === 'team' ? fetchLeaves : fetchMyLeaves);

  // Load HR-configured leave types for the request form
  useEffect(() => {
    leaveTypeService
      .getLeaveTypes()
      .then((types) => {
        if (types.length > 0) {
          setLeaveTypes(types.map((t) => t.name));
          setNoLeadApprovalTypes(types.filter((t) => !t.requiresLeadApproval).map((t) => t.name));
        }
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  const filteredLeaves = leaves.filter((l) =>
    !searchQuery || l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || l.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyLeaves = myLeaves.filter((l) => mySelectedStatus === 'ALL' || l.status === mySelectedStatus);

  const summary = {
    pending: leaves.filter((l) => l.status === 'Pending').length,
    leadApproved: leaves.filter((l) => l.status === 'Approved').length,
    hrApproved: leaves.filter((l) => l.status === 'Final Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  const mySummary = {
    pending: myLeaves.filter((l) => l.status === 'Pending').length,
    upcoming: myLeaves.filter((l) => ['Approved', 'In Process', 'Final Approved'].includes(l.status)).length,
    rejected: myLeaves.filter((l) => l.status === 'Rejected').length,
  };

  const handleApprove = async (leaveId: string) => {
    const target = leaves.find((l) => l.id === leaveId);
    setActionInProgress(leaveId);
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/approve`, {
        method: 'PUT',
        headers: postHeaders(),
        body: JSON.stringify({ note: 'Approved by lead' }),
      });
      if (res.ok) {
        showToast(`Approved ${target?.employeeName || 'the'}'s leave request.`, 'success');
        fetchLeaves();
      } else {
        showToast('Could not approve the request. Please try again.', 'error');
      }
    } catch {
      showToast('Could not approve the request. Please try again.', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    const target = leaves.find((l) => l.id === leaveId);
    setActionInProgress(leaveId);
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/reject`, {
        method: 'PUT',
        headers: postHeaders(),
        body: JSON.stringify({ note: 'Rejected by lead' }),
      });
      if (res.ok) {
        showToast(`Rejected ${target?.employeeName || 'the'}'s leave request.`, 'error');
        fetchLeaves();
      } else {
        showToast('Could not reject the request. Please try again.', 'error');
      }
    } catch {
      showToast('Could not reject the request. Please try again.', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSubmitRequest = async () => {
    if (isSubmitting) return;
    if (!formLeaveType || !formStartDate || !formEndDate) {
      setFormError('Leave type, start date and end date are required.');
      return;
    }
    if (formEndDate < formStartDate) {
      setFormError('End date cannot be before start date.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: postHeaders(),
        body: JSON.stringify({
          employeeEmail: user.email,
          leaveType: formLeaveType,
          startDate: formStartDate,
          endDate: formEndDate,
          reason: formReason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowRequestForm(false);
        setFormLeaveType('');
        setFormStartDate('');
        setFormEndDate('');
        setFormReason('');
        showToast('Leave request submitted. Your lead (or HR) will review it.', 'success');
        fetchMyLeaves();
      } else {
        setFormError(data.error || 'Unable to submit leave request.');
      }
    } catch {
      setFormError('Unable to submit leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (leaveId: string) => {
    setActionInProgress(leaveId);
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/withdraw`, {
        method: 'PUT',
        headers: postHeaders(),
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showToast('Leave request withdrawn.', 'success');
        fetchMyLeaves();
      } else {
        showToast('Could not withdraw. Only pending requests can be withdrawn.', 'error');
      }
    } catch {
      showToast('Could not withdraw the request. Please try again.', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Toast feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border text-slate-900 text-xs shadow-2xl flex items-center gap-3 animate-scaleUp ${
            toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
          }`}
          id="lead-leave-toast"
        >
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold text-slate-900">{toast.type === 'success' ? 'Success' : 'Notice'}</div>
            <div className="text-slate-600 font-medium">{toast.text}</div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/lead/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Leaves</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team leave management & your own requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewTab === 'my' && (
            <button
              type="button"
              onClick={() => setShowRequestForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
              id="lead-request-leave-btn"
            >
              <Plus className="w-4 h-4" />
              Request Leave
            </button>
          )}
          <button
            onClick={viewTab === 'team' ? fetchLeaves : fetchMyLeaves}
            disabled={viewTab === 'team' ? isLoading : myIsLoading}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(viewTab === 'team' ? isLoading : myIsLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Team / My Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70 w-fit">
        {([
          { id: 'team' as const, label: 'Team Requests', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'my' as const, label: 'My Requests', icon: <UserIcon className="w-3.5 h-3.5" /> },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {viewTab === 'team' ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending', value: summary.pending, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
              { label: 'Lead Approved', value: summary.leadApproved, icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
              { label: 'HR Approved', value: summary.hrApproved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
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
                  placeholder="Search employee..."
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
                  {TEAM_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-500">Loading leaves…</p>
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
              <p className="text-xs text-slate-400">Team leave requests will appear here.</p>
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
                        onClick={() => setDetailLeave(leave)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-semibold text-slate-700">{leave.employeeName}</div>
                          <div className="text-[10px] text-slate-500">{leave.employeeCode}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{leave.leaveType}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{leave.startDate} → {leave.endDate}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.totalDays}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={leave.status} size="xs" />
                          {(leave.leadApprovalDate || leave.hrApprovalDate) && (
                            <div className="mt-1 space-y-0.5">
                              {leave.leadApprovalDate && (
                                <div className="text-[10px] text-slate-400 font-medium">Lead: {leave.leadApprovalDate}</div>
                              )}
                              {leave.hrApprovalDate && (
                                <div className="text-[10px] text-emerald-600 font-semibold">HR: {leave.hrApprovalDate}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          {leave.status === 'Pending' && noLeadApprovalTypes.includes(leave.leaveType) ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-slate-400 italic">HR decides directly</span>
                              <button
                                onClick={() => setDetailLeave(leave)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : leave.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setDetailLeave(leave)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                disabled={actionInProgress === leave.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                disabled={actionInProgress === leave.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDetailLeave(leave)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              aria-label="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* My Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending', value: mySummary.pending, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
              { label: 'Approved', value: mySummary.upcoming, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
              { label: 'Rejected', value: mySummary.rejected, icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
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

          {/* My Filter Bar */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-end gap-3">
              <div className="relative">
                <select
                  value={mySelectedStatus}
                  onChange={(e) => setMySelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {MY_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* My Content */}
          {myIsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-500">Loading your requests…</p>
              </div>
            </div>
          ) : myError ? (
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-rose-600">{myError}</p>
              <button onClick={fetchMyLeaves} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
            </div>
          ) : filteredMyLeaves.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <CalendarDays className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No leave requests yet</p>
              <p className="text-xs text-slate-400 mb-4">Submit a request and track its approval status here.</p>
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Request Leave
              </button>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Dates</th>
                      <th className="px-5 py-3.5">Days</th>
                      <th className="px-5 py-3.5">Reason</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {filteredMyLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.leaveType}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{leave.startDate} → {leave.endDate}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.totalDays}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[220px] truncate">{leave.reason || '-'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${myStatusChip(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right pr-5">
                          {leave.status === 'Pending' ? (
                            <button
                              onClick={() => handleWithdraw(leave.id)}
                              disabled={actionInProgress === leave.id}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              {actionInProgress === leave.id ? '…' : 'Withdraw'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Request Leave Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => !isSubmitting && setShowRequestForm(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Leave</h3>
                  <p className="text-[11px] text-slate-500">Submit a new leave request for approval</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRequestForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Type *</label>
                <div className="relative">
                  <select
                    value={formLeaveType}
                    onChange={(e) => setFormLeaveType(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={formStartDate || undefined}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason</label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={3}
                  placeholder="Brief reason for your leave…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-700 font-medium">{formError}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-100/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team leave detail modal */}
      <LeadLeaveDetailModal
        leave={detailLeave}
        actionInProgress={actionInProgress}
        leadCanDecide={!noLeadApprovalTypes.includes(detailLeave?.leaveType || '')}
        onClose={() => setDetailLeave(null)}
        onApprove={(id) => {
          setDetailLeave(null);
          handleApprove(id);
        }}
        onReject={(id) => {
          setDetailLeave(null);
          handleReject(id);
        }}
      />
    </div>
  );
};
