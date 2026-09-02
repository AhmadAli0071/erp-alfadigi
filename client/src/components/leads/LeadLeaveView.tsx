import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { StatusBadge } from '../hr/StatusBadge';
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

const STATUS_OPTIONS = ['ALL', 'Pending', 'Approved', 'Rejected'];

export const LeadLeaveView: React.FC<LeadLeaveViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = leaves.filter((l) =>
    !searchQuery || l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || l.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    pending: leaves.filter((l) => l.status === 'Pending').length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  const handleApprove = async (leaveId: string) => {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ note: 'Approved by lead' }),
      });
      if (res.ok) fetchLeaves();
    } catch { /* ignore */ }
  };

  const handleReject = async (leaveId: string) => {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ note: 'Rejected by lead' }),
      });
      if (res.ok) fetchLeaves();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Team Leaves</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team leave management</p>
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: summary.pending, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'Approved', value: summary.approved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
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
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
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
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{leave.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{leave.employeeCode}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{leave.startDate} → {leave.endDate}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{leave.totalDays}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={leave.status as 'Pending' | 'Approved' | 'Rejected'} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-right pr-5">
                      {leave.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
