import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { StatusBadge } from '../hr/StatusBadge';
import {
  Clock,
  ArrowLeft,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  CalendarDays,
  Home,
  Table as TableIcon,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';

interface LeadAttendanceViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
}

interface TeamAttendanceRecord {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workingMinutes: number;
  status: string;
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

const STATUS_OPTIONS = ['ALL', 'Present', 'Absent', 'Late', 'On Leave', 'Work From Home', 'Half Day'];

export const LeadAttendanceView: React.FC<LeadAttendanceViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [records, setRecords] = useState<TeamAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/team/${user.email}?date=${selectedDate}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRecords(data.team || []);
    } catch {
      setError('Unable to load team attendance.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email, selectedDate]);

  useEffect(() => {
    fetchTeamAttendance();
  }, [fetchTeamAttendance]);

  const filteredRecords = records
    .filter((r) => selectedStatus === 'ALL' || r.status === selectedStatus)
    .filter((r) => !searchQuery || r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()));

  const summary = {
    present: records.filter((r) => r.status === 'Present' || r.status === 'Late').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'On Leave').length,
    wfh: records.filter((r) => r.status === 'Work From Home').length,
  };

  const summaryCards = [
    { label: 'Present', value: summary.present, icon: <UserCheck className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
    { label: 'Absent', value: summary.absent, icon: <UserX className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
    { label: 'On Leave', value: summary.onLeave, icon: <CalendarDays className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
    { label: 'WFH', value: summary.wfh, icon: <Home className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-500/[0.04] border-sky-200' },
  ];

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Team Attendance</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team attendance records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer"
          />
          <button
            onClick={fetchTeamAttendance}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {card.icon}
              <span className="text-xs font-medium text-slate-700">{card.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">{card.value}</span>
          </div>
        ))}
      </div>

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
          <button onClick={fetchTeamAttendance} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Clock className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No attendance records</p>
          <p className="text-xs text-slate-400">Team attendance for this date will appear here.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Working Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredRecords.map((rec) => (
                  <tr key={rec.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{rec.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{rec.employeeCode} · {rec.jobTitle}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={rec.status as 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Half Day'} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{rec.clockIn || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{rec.clockOut || '—'}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{formatMinutes(rec.workingMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((rec) => (
            <div key={rec.employeeId} className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">{rec.employeeName}</div>
                  <div className="text-[10px] text-slate-500">{rec.employeeCode} · {rec.jobTitle}</div>
                </div>
                <StatusBadge status={rec.status as 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Half Day'} size="xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500">Clock In</div>
                  <div className="text-xs font-bold text-slate-700">{rec.clockIn || '—'}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] text-slate-500">Working</div>
                  <div className="text-xs font-bold text-slate-700">{formatMinutes(rec.workingMinutes)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
