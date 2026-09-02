import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  Clock,
  Play,
  Pause,
  Square,
  Timer,
  Coffee,
  CalendarDays,
  Ticket,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface EmployeeDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

type ClockState = 'not_clocked_in' | 'working' | 'on_break' | 'clocked_out';

interface TodayAttendance {
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

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ user, onNavigate }) => {
  const [clockState, setClockState] = useState<ClockState>('not_clocked_in');
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [workingMinutes, setWorkingMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance/today/${user.email}`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.attendance) {
        const att = data.attendance;
        if (att.clockIn && att.clockOut) {
          setClockState('clocked_out');
          setClockInTime(att.clockIn);
          setClockOutTime(att.clockOut);
          setWorkingMinutes(att.workingMinutes);
          setBreakMinutes(att.breakMinutes);
        } else if (att.clockIn) {
          setClockState('working');
          setClockInTime(att.clockIn);
          setWorkingMinutes(att.workingMinutes);
          setBreakMinutes(att.breakMinutes);
        }
      }
    } catch {
      // ignore
    }
  }, [user.email]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const handleClockIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to clock in.');
        return;
      }
      setClockState('working');
      setClockInTime(data.attendance.clockIn);
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to clock out.');
        return;
      }
      setClockState('clocked_out');
      setClockOutTime(data.attendance.clockOut);
      setWorkingMinutes(data.attendance.workingMinutes);
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderClockButton = () => {
    switch (clockState) {
      case 'not_clocked_in':
        return (
          <button
            onClick={handleClockIn}
            disabled={isLoading}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-3">
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              <span>{isLoading ? 'Starting…' : 'Clock In'}</span>
            </div>
          </button>
        );
      case 'working':
        return (
          <button
            onClick={handleClockOut}
            disabled={isLoading}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-3">
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
              <span>{isLoading ? 'Stopping…' : 'Clock Out'}</span>
            </div>
          </button>
        );
      case 'clocked_out':
        return (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">Shift completed for today</span>
          </div>
        );
      default:
        return null;
    }
  };

  const summaryCards = [
    {
      label: 'Clock In',
      value: clockInTime || '—',
      icon: <Play className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Clock Out',
      value: clockOutTime || '—',
      icon: <Square className="w-4 h-4 text-rose-600" />,
      color: 'bg-rose-50 border-rose-200',
    },
    {
      label: 'Working Hours',
      value: formatMinutes(workingMinutes),
      icon: <Timer className="w-4 h-4 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Break',
      value: formatMinutes(breakMinutes),
      icon: <Coffee className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Clock In/Out Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Today's Shift</h2>
            <p className="text-xs text-slate-500">
              {clockState === 'not_clocked_in' && "You haven't clocked in yet."}
              {clockState === 'working' && `Working since ${clockInTime}`}
              {clockState === 'clocked_out' && `Shift completed — ${formatMinutes(workingMinutes)} worked`}
            </p>
          </div>
          {renderClockButton()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {summaryCards.map((card) => (
          <div key={card.label} className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${card.color} border`}>
                {card.icon}
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">{card.value}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'View Attendance', icon: <Clock className="w-4 h-4" />, route: '/employee/attendance', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { label: 'Request Leave', icon: <CalendarDays className="w-4 h-4" />, route: '/employee/leaves', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Create Ticket', icon: <Ticket className="w-4 h-4" />, route: '/employee/tickets', color: 'text-rose-600 bg-rose-50 border-rose-200' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.route)}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${action.color}`}>
                  {action.icon}
                </div>
                <span className="text-xs font-bold text-slate-700">{action.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
