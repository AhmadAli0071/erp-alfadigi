import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  Clock,
  ArrowLeft,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { StatusBadge } from '../hr/StatusBadge';

interface EmployeeAttendanceViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface AttendanceRecord {
  id: string;
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

export const EmployeeAttendanceView: React.FC<EmployeeAttendanceViewProps> = ({
  user,
  onNavigate,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

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

  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    avgHours: records.length > 0
      ? formatMinutes(Math.round(records.reduce((a, r) => a + r.workingMinutes, 0) / records.length))
      : '00:00',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-indigo-600" />
              My Attendance
            </h1>
            <p className="text-xs text-slate-500">Your attendance history and records</p>
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
                  <th className="py-3 px-3 text-right pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{rec.date}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">{rec.clockIn || '—'}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">{rec.clockOut || '—'}</td>
                    <td className="py-3.5 px-3 text-xs font-semibold text-slate-700">{formatMinutes(rec.workingMinutes)}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-500">{formatMinutes(rec.breakMinutes)}</td>
                    <td className="py-3.5 px-3 text-right pr-4">
                      <StatusBadge status={rec.status as 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'} size="xs" />
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
