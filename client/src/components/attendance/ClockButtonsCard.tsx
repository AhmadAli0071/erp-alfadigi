import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  Play,
  Square,
  Timer,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface ClockButtonsCardProps {
  user: User;
  title?: string;
  showSummaryCards?: boolean;
}

type ClockState = 'not_clocked_in' | 'working' | 'on_break' | 'clocked_out';

interface TodayAttendance {
  clockIn: string | null;
  clockInAt: string | null;
  clockOut: string | null;
  breakMinutes: number;
  breakStartedAt: string | null;
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

const formatSeconds = (totalSecs: number): string => {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const ClockButtonsCard: React.FC<ClockButtonsCardProps> = ({
  user,
  title = "Today's Shift",
  showSummaryCards = true,
}) => {
  const [clockState, setClockState] = useState<ClockState>('not_clocked_in');
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [workingMinutes, setWorkingMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [clockInAt, setClockInAt] = useState<Date | null>(null);
  const [breakStartedAt, setBreakStartedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live ticking timer — updates every second
  useEffect(() => {
    if (clockState === 'working' || clockState === 'on_break') {
      const t = setInterval(() => setNowTick(Date.now()), 1000);
      return () => clearInterval(t);
    }
  }, [clockState]);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance/today/${user.email}`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.attendance) {
        const att: TodayAttendance = data.attendance;
        if (att.clockIn) {
          setClockInTime(att.clockIn);
          if (att.clockInAt) setClockInAt(new Date(att.clockInAt));
        }
        if (att.clockOut) {
          setClockState('clocked_out');
          setClockOutTime(att.clockOut);
        } else if (att.breakStartedAt) {
          setClockState('on_break');
          setBreakStartedAt(new Date(att.breakStartedAt));
        } else if (att.clockIn) {
          setClockState('working');
        }
        setWorkingMinutes(att.workingMinutes || 0);
        setBreakMinutes(att.breakMinutes || 0);
      }
    } catch {
      // ignore
    }
  }, [user.email]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const handleClockIn = async () => {
    setIsLoading('in');
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
      setClockInAt(new Date());
      setBreakMinutes(0);
      setBreakStartedAt(null);
      setNowTick(Date.now());
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleBreakToggle = async () => {
    const ending = clockState === 'on_break';
    setIsLoading('break');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/break-${ending ? 'end' : 'start'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Break action failed.');
        return;
      }
      if (ending) {
        setBreakMinutes(data.breakMinutes || breakMinutes);
        setBreakStartedAt(null);
        setClockState('working');
      } else {
        setBreakStartedAt(new Date());
        setClockState('on_break');
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleClockOut = async () => {
    setIsLoading('out');
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
      setBreakMinutes(data.attendance.breakMinutes ?? breakMinutes);
      setBreakStartedAt(null);
      setClockInAt(null);
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  /* ---------- Round Action Button ---------- */
  interface RoundButtonProps {
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    variant: 'emerald' | 'amber' | 'rose';
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
    loading?: boolean;
  }

  const variantConfig = {
    emerald: {
      grad: 'from-emerald-400 via-emerald-500 to-teal-600',
      ring: 'ring-emerald-400/60',
      border: 'border-emerald-200',
      glow: 'shadow-[0_0_35px_-5px_rgba(16,185,129,0.55)]',
      ping: 'bg-emerald-400/25',
      icon: 'text-white',
      label: 'text-emerald-700',
    },
    amber: {
      grad: 'from-amber-400 via-orange-500 to-orange-600',
      ring: 'ring-amber-400/60',
      border: 'border-amber-200',
      glow: 'shadow-[0_0_35px_-5px_rgba(245,158,11,0.55)]',
      ping: 'bg-amber-400/25',
      icon: 'text-white',
      label: 'text-amber-700',
    },
    rose: {
      grad: 'from-rose-400 via-rose-500 to-red-600',
      ring: 'ring-rose-400/60',
      border: 'border-rose-200',
      glow: 'shadow-[0_0_35px_-5px_rgba(244,63,94,0.55)]',
      ping: 'bg-rose-400/25',
      icon: 'text-white',
      label: 'text-rose-700',
    },
  };

  const RefreshSpinner = () => (
    <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  const RoundActionButton: React.FC<RoundButtonProps> = ({
    label,
    sublabel,
    icon,
    variant,
    onClick,
    disabled = false,
    active = false,
    loading = false,
  }) => {
    const cfg = variantConfig[variant];
    return (
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative">
          {/* Lightning pulse rings — only when active */}
          {active && !disabled && (
            <>
              <span className={`absolute inset-0 rounded-full ${cfg.ping} animate-ping`} />
              <span className={`absolute -inset-1.5 rounded-full ${cfg.ping} opacity-60 animate-pulse`} />
            </>
          )}

          {/* Outer decorative dashed ring */}
          <div
            className={`absolute -inset-2 rounded-full border-2 border-dashed transition-all duration-500 ${
              active && !disabled ? `${cfg.border} animate-[spin_12s_linear_infinite]` : 'border-slate-200/70'
            }`}
          />

          <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full z-[1]
              bg-gradient-to-br ${cfg.grad}
              ring-4 ${active && !disabled ? cfg.ring : 'ring-transparent'}
              border-4 border-white/70
              ${active && !disabled ? `${cfg.glow} scale-100` : 'shadow-lg'}
              flex items-center justify-center
              transition-all duration-300 ease-out
              ${!disabled && !loading ? 'hover:scale-110 hover:brightness-110 cursor-pointer active:scale-95' : ''}
              ${disabled && !loading ? 'opacity-35 saturate-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Inner white highlight ring for glossy look */}
            <span className="absolute inset-2 rounded-full border-2 border-white/30 pointer-events-none" />
            {/* Lightning bolt sparkle */}
            {active && !disabled && (
              <Zap className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 fill-amber-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-pulse" />
            )}
            <span className={loading ? 'animate-spin' : ''}>
              {loading ? (
                <RefreshSpinner />
              ) : (
                <span className={cfg.icon}>{icon}</span>
              )}
            </span>
          </button>
        </div>
        <div className="text-center">
          <div className={`text-xs font-extrabold tracking-wide ${disabled ? 'text-slate-400' : cfg.label}`}>{label}</div>
          {sublabel && <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{sublabel}</div>}
        </div>
      </div>
    );
  };

  /* ---------- Live timer calculation ---------- */
  const liveElapsed = (() => {
    if (!clockInAt || (clockState !== 'working' && clockState !== 'on_break')) return null;
    const totalMs = nowTick - clockInAt.getTime();
    const breakMs =
      breakMinutes * 60000 +
      (clockState === 'on_break' && breakStartedAt ? nowTick - breakStartedAt.getTime() : 0);
    return Math.max(0, Math.floor((totalMs - breakMs) / 1000));
  })();

  const liveBreakSeconds =
    clockState === 'on_break' && breakStartedAt
      ? Math.max(0, Math.floor((nowTick - breakStartedAt.getTime()) / 1000))
      : null;

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
      value: liveElapsed !== null ? formatSeconds(liveElapsed) : formatMinutes(workingMinutes),
      icon: <Timer className={`w-4 h-4 text-indigo-600 ${liveElapsed !== null ? 'animate-pulse' : ''}`} />,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Break',
      value: formatMinutes(breakMinutes),
      icon: <Coffee className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
    },
  ];

  const statusText =
    clockState === 'not_clocked_in'
      ? "You haven't clocked in yet — start your shift!"
      : clockState === 'working'
      ? `Working since ${clockInTime}`
      : clockState === 'on_break'
      ? `On break — enjoying coffee?`
      : `Shift completed — ${formatMinutes(workingMinutes)} worked`;

  return (
    <div className="space-y-3.5">
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Clock Buttons Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{statusText}</p>
          </div>

          <div className="flex items-start justify-center gap-8 sm:gap-14 flex-wrap">
            <RoundActionButton
              label="CLOCK IN"
              sublabel={clockInTime ? `at ${clockInTime}` : 'Start shift'}
              icon={<Play className="w-9 h-9 fill-white drop-shadow" />}
              variant="emerald"
              onClick={handleClockIn}
              disabled={clockState !== 'not_clocked_in'}
              active={clockState === 'not_clocked_in'}
              loading={isLoading === 'in'}
            />

            <RoundActionButton
              label={clockState === 'on_break' ? 'RESUME' : 'BREAK'}
              sublabel={
                clockState === 'on_break'
                  ? 'End break'
                  : breakMinutes > 0
                  ? `${formatMinutes(breakMinutes)} taken`
                  : 'Take a pause'
              }
              icon={<Coffee className="w-9 h-9 drop-shadow" />}
              variant="amber"
              onClick={handleBreakToggle}
              disabled={clockState === 'not_clocked_in' || clockState === 'clocked_out'}
              active={clockState === 'working' || clockState === 'on_break'}
              loading={isLoading === 'break'}
            />

            <RoundActionButton
              label="CLOCK OUT"
              sublabel={clockOutTime ? `at ${clockOutTime}` : 'End shift'}
              icon={<Square className="w-9 h-9 fill-white drop-shadow" />}
              variant="rose"
              onClick={handleClockOut}
              disabled={clockState === 'not_clocked_in' || clockState === 'clocked_out'}
              active={clockState === 'working' || clockState === 'on_break'}
              loading={isLoading === 'out'}
            />
          </div>

          {/* Live Timer */}
          {liveElapsed !== null && (
            <div className="mt-7 flex flex-col items-center gap-2">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums select-none">
                {formatSeconds(liveElapsed)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                {clockState === 'working' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-600">Live — Working Time</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <span className="text-amber-600">
                      On Break — {formatSeconds(liveBreakSeconds || 0)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {clockState === 'clocked_out' && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Shift completed for today — Great work!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {showSummaryCards && (
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
      )}
    </div>
  );
};
