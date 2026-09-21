import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
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
  Coffee,
  ChevronDown,
  Play,
  Utensils,
  Moon,
  Toilet,
} from 'lucide-react';

interface LeadAttendanceViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
}

type BreakTypeKey = 'LUNCH' | 'NAMAZ' | 'WASHROOM';
type BudgetKey = 'lunch' | 'namaz' | 'washroom';

const MEMBER_BREAK_TYPES: { key: BreakTypeKey; budgetKey: BudgetKey; label: string; icon: React.FC<{ className?: string }>; chip: string }[] = [
  { key: 'LUNCH', budgetKey: 'lunch', label: 'Lunch', icon: Utensils, chip: 'bg-orange-100 text-orange-700' },
  { key: 'NAMAZ', budgetKey: 'namaz', label: 'Namaz', icon: Moon, chip: 'bg-emerald-100 text-emerald-700' },
  { key: 'WASHROOM', budgetKey: 'washroom', label: 'Washroom', icon: Toilet, chip: 'bg-sky-100 text-sky-700' },
];

interface TeamAttendanceRecord {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail?: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workingMinutes: number;
  status: string;
  onBreak?: boolean;
  breakStartedAt?: string | null;
  breakType?: 'LUNCH' | 'NAMAZ' | 'WASHROOM' | null;
  breakMinutesByType?: { lunch: number; namaz: number; washroom: number };
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

const utcToday = (): string => new Date().toISOString().split('T')[0];

const shiftUtcDate = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

const dayLabel = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const PRESENT_LIKE_STATUSES = ['Present', 'Late', 'Short Hours', 'On Duty', 'Pending OT'];

const STATUS_OPTIONS = ['ALL', 'Present', 'Absent', 'Late', 'Short Hours', 'Leave', 'Work From Home', 'Half Day', 'On Duty'];

const statusOptionLabel = (s: string): string => (s === 'ALL' ? 'All Status' : s === 'Leave' ? 'On Leave' : s);

/** Live "On Break" duration in minutes from breakStartedAt, refreshed every 30s. */
const useNowTick = (intervalMs = 30000): number => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
};

export const LeadAttendanceView: React.FC<LeadAttendanceViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [selectedDate, setSelectedDate] = useState(utcToday());
  const [rangeDays, setRangeDays] = useState<'day' | 7 | 30>('day');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const nowTick = useNowTick();
  const onBreakMinutes = (rec: TeamAttendanceRecord): number | null => {
    if (!rec.onBreak || !rec.breakStartedAt) return null;
    const mins = Math.round((nowTick - new Date(rec.breakStartedAt).getTime()) / 60000);
    return Number.isFinite(mins) ? Math.max(0, mins) : null;
  };
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [records, setRecords] = useState<TeamAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url =
        rangeDays === 'day'
          ? `${API_BASE}/attendance/team/${user.email}?date=${selectedDate}`
          : `${API_BASE}/attendance/team/${user.email}?startDate=${shiftUtcDate(-(rangeDays - 1))}&endDate=${utcToday()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRecords(rangeDays === 'day' ? data.team || [] : data.records || []);
    } catch {
      setError('Unable to load team attendance.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email, selectedDate, rangeDays]);

  useEffect(() => {
    fetchTeamAttendance();
  }, [fetchTeamAttendance]);

  // Live refresh: SSE notification ya window focus par team attendance refetch
  useRealtimeRefresh(fetchTeamAttendance);

  /* ---------- Member break controls (lead) ---------- */
  const [breakBudgets, setBreakBudgets] = useState<Record<BudgetKey, number>>({ lunch: 60, namaz: 10, washroom: 10 });
  const [breakMenuFor, setBreakMenuFor] = useState<string | null>(null);
  const [breakBusyFor, setBreakBusyFor] = useState<string | null>(null);
  const [breakMsg, setBreakMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/attendance/today/${user.email}`, { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.breakBudgets) setBreakBudgets(data.breakBudgets);
      } catch {
        // ignore
      }
    })();
  }, [user.email]);

  const memberRemaining = (rec: TeamAttendanceRecord, k: BudgetKey): number =>
    Math.max(0, breakBudgets[k] - (rec.breakMinutesByType?.[k] || 0));

  const memberBreakAction = async (rec: TeamAttendanceRecord, action: 'start' | 'end', type?: BreakTypeKey) => {
    if (!rec.employeeEmail) return;
    setBreakBusyFor(rec.employeeId);
    setBreakMsg(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/break-${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          employeeEmail: user.email,
          memberEmail: rec.employeeEmail,
          ...(action === 'start' ? { breakType: type } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBreakMsg({ ok: false, text: data.error || 'Break action failed.' });
      } else if (action === 'start') {
        setBreakMsg({ ok: true, text: `${rec.employeeName} ka ${MEMBER_BREAK_TYPES.find((t) => t.key === type)?.label} break start ho gaya.` });
        setBreakMenuFor(null);
      } else {
        setBreakMsg({ ok: true, text: `${rec.employeeName} ka break end ho gaya (${data.lastBreakMinutes} min).` });
      }
      await fetchTeamAttendance();
    } catch {
      setBreakMsg({ ok: false, text: 'Unable to connect to server.' });
    } finally {
      setBreakBusyFor(null);
      setTimeout(() => setBreakMsg(null), 6000);
    }
  };

  const filteredRecords = records
    .filter((r) => selectedStatus === 'ALL' || r.status === selectedStatus)
    .filter((r) => !searchQuery || r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()));

  const summary = {
    present: records.filter((r) => PRESENT_LIKE_STATUSES.includes(r.status)).length,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'Leave' || r.status === 'On Leave').length,
    wfh: records.filter((r) => r.status === 'Work From Home').length,
  };

  const summaryCards = [
    { label: 'Present', value: summary.present, icon: <UserCheck className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
    { label: 'Absent', value: summary.absent, icon: <UserX className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
    { label: 'On Leave', value: summary.onLeave, icon: <CalendarDays className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
    { label: 'WFH', value: summary.wfh, icon: <Home className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-500/[0.04] border-sky-200' },
  ];

  /* ---------- Member break control cell (day view only) ---------- */
  const isLiveDay = rangeDays === 'day' && selectedDate === utcToday();

  const renderMemberBreakControl = (rec: TeamAttendanceRecord): React.ReactNode => {
    if (!isLiveDay || !rec.employeeEmail) return <span className="text-xs text-slate-300">—</span>;

    const busy = breakBusyFor === rec.employeeId;

    // On break right now → End button with type + live minutes
    if (rec.onBreak) {
      const typeLabel = rec.breakType ? rec.breakType.charAt(0) + rec.breakType.slice(1).toLowerCase() : '';
      const mins = onBreakMinutes(rec);
      return (
        <button
          type="button"
          disabled={busy}
          onClick={() => memberBreakAction(rec, 'end')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer
            ${busy ? 'bg-rose-50 border-rose-200 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
          title="End this team member's break"
        >
          {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          End Break{typeLabel ? ` (${typeLabel})` : ''}{mins !== null ? ` · ${mins}m` : ''}
        </button>
      );
    }

    // Clocked in, not on break, not clocked out → Break type menu (inline, no absolute popup)
    if (rec.clockIn && !rec.clockOut) {
      const menuOpen = breakMenuFor === rec.employeeId;
      return (
        <div className="inline-flex flex-col items-stretch gap-1.5 text-left">
          <button
            type="button"
            disabled={busy}
            onClick={() => setBreakMenuFor(menuOpen ? null : rec.employeeId)}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer
              ${busy ? 'bg-amber-50 border-amber-200 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}
          >
            {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Coffee className="w-3 h-3" />}
            Break
            <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 space-y-1">
              <div className="px-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Start break — {rec.employeeName.split(' ')[0]}
              </div>
              {MEMBER_BREAK_TYPES.map((t) => {
                const remaining = memberRemaining(rec, t.budgetKey);
                const budget = breakBudgets[t.budgetKey];
                const exhausted = remaining <= 0;
                const blocked = exhausted && t.key !== 'LUNCH';
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    disabled={blocked}
                    onClick={() => memberBreakAction(rec, 'start', t.key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors
                      ${blocked ? 'opacity-50 cursor-not-allowed' : `cursor-pointer hover:bg-slate-50`}`}
                  >
                    <span className={`p-1 rounded-md ${t.chip}`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    <span className="flex-1 text-left text-[11px] font-bold text-slate-700">{t.label}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${exhausted ? (blocked ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-600') : 'bg-slate-100 text-slate-500'}`}>
                        {blocked ? 'DONE' : exhausted ? 'EXTRA' : `${remaining}m left`}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      );
    }

    return (
      <span className="text-[10px] font-semibold text-slate-300">
        {rec.clockOut ? 'Shift done' : 'Not clocked in'}
      </span>
    );
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Team Attendance</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team attendance records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
            {(['day', 7, 30] as const).map((mode) => (
              <button
                key={String(mode)}
                type="button"
                onClick={() => setRangeDays(mode)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  rangeDays === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode === 'day' ? 'Day' : `Last ${mode} Days`}
              </button>
            ))}
          </div>
          {rangeDays === 'day' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer"
            />
          )}
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
                <option key={s} value={s}>{statusOptionLabel(s)}</option>
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

      {/* Break action feedback */}
      {breakMsg && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${breakMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {breakMsg.ok ? <UserCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {breakMsg.text}
        </div>
      )}

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
          <p className="text-xs text-slate-400">
            {rangeDays === 'day' ? 'Team attendance for this date will appear here.' : `No attendance records found in the selected ${rangeDays}-day range.`}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Employee</th>
                  {rangeDays !== 'day' && <th className="px-5 py-3.5">Date</th>}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Working Hours</th>
                  {isLiveDay && <th className="px-5 py-3.5">Break Control</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredRecords.map((rec) => (
                  <tr key={rec.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{rec.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{rec.employeeCode} · {rec.jobTitle}</div>
                    </td>
                    {rangeDays !== 'day' && (
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{dayLabel(rec.date)}</td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={rec.status as 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Half Day'} size="xs" />
                        {onBreakMinutes(rec) !== null && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold animate-pulse">
                            On Break{rec.breakType ? ` (${rec.breakType.charAt(0) + rec.breakType.slice(1).toLowerCase()})` : ''} · {onBreakMinutes(rec)}m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{rec.clockIn || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{rec.clockOut || '—'}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{formatMinutes(rec.workingMinutes)}</td>
                    {isLiveDay && (
                      <td className="px-5 py-3.5">
                        {renderMemberBreakControl(rec)}
                      </td>
                    )}
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
                  <div className="text-[10px] text-slate-500">{rec.employeeCode} · {rec.jobTitle}{rangeDays !== 'day' ? ` · ${dayLabel(rec.date)}` : ''}</div>
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
              {isLiveDay && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                  {renderMemberBreakControl(rec)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
