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
  Utensils,
  Moon,
  Toilet,
  Lock,
  ChevronUp,
} from 'lucide-react';

interface ClockButtonsCardProps {
  user: User;
  title?: string;
  showSummaryCards?: boolean;
}

type ClockState = 'not_clocked_in' | 'working' | 'on_break' | 'clocked_out';
type BreakTypeKey = 'LUNCH' | 'NAMAZ' | 'WASHROOM';
type BudgetKey = 'lunch' | 'namaz' | 'washroom';

interface TypeBudgets {
  lunch: number;
  namaz: number;
  washroom: number;
}

interface TodayAttendance {
  clockIn: string | null;
  clockInAt: string | null;
  clockOut: string | null;
  breakMinutes: number;
  breakStartedAt: string | null;
  breakType: BreakTypeKey | null;
  breakMinutesByType: TypeBudgets;
  workingMinutes: number;
  status: string;
}

const API_BASE = '/api';

const BREAK_TYPE_CONFIG: {
  key: BreakTypeKey;
  budgetKey: BudgetKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  row: string;
  chip: string;
}[] = [
  { key: 'LUNCH', budgetKey: 'lunch', label: 'Lunch', icon: Utensils, row: 'hover:bg-orange-50/80', chip: 'bg-orange-100 text-orange-700' },
  { key: 'NAMAZ', budgetKey: 'namaz', label: 'Namaz', icon: Moon, row: 'hover:bg-emerald-50/80', chip: 'bg-emerald-100 text-emerald-700' },
  { key: 'WASHROOM', budgetKey: 'washroom', label: 'Washroom', icon: Toilet, row: 'hover:bg-sky-50/80', chip: 'bg-sky-100 text-sky-700' },
];

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

const formatMMSS = (totalSecs: number): string => {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  const [breakMinutesByType, setBreakMinutesByType] = useState<TypeBudgets>({ lunch: 0, namaz: 0, washroom: 0 });
  const [budgets, setBudgets] = useState<TypeBudgets>({ lunch: 60, namaz: 10, washroom: 10 });
  const [activeBreakType, setActiveBreakType] = useState<BreakTypeKey | null>(null);
  const [showBreakMenu, setShowBreakMenu] = useState(false);
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
      if (data.breakBudgets) setBudgets(data.breakBudgets);
      if (data.attendance) {
        const att: TodayAttendance = data.attendance;
        if (att.clockIn) {
          setClockInTime(att.clockIn);
          if (att.clockInAt) setClockInAt(new Date(att.clockInAt));
        }
        setBreakMinutesByType(att.breakMinutesByType || { lunch: 0, namaz: 0, washroom: 0 });
        setActiveBreakType(att.breakType || null);
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
      setBreakMinutesByType({ lunch: 0, namaz: 0, washroom: 0 });
      setBreakStartedAt(null);
      setActiveBreakType(null);
      setShowBreakMenu(false);
      setNowTick(Date.now());
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleBreakStart = async (type: BreakTypeKey) => {
    setIsLoading(`break-${type}`);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/break-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeEmail: user.email, breakType: type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Break action failed.');
        return;
      }
      setShowBreakMenu(false);
      setActiveBreakType(type);
      setBreakStartedAt(new Date());
      setClockState('on_break');
      setNowTick(Date.now());
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleBreakEnd = async () => {
    setIsLoading('break-end');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/attendance/break-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ employeeEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Break action failed.');
        return;
      }
      setBreakMinutes(data.breakMinutes || breakMinutes);
      if (data.breakMinutesByType) setBreakMinutesByType(data.breakMinutesByType);
      if (data.overLimit) {
        setError('Break went over the daily limit — extra minutes were deducted from working hours.');
      }
      setBreakStartedAt(null);
      setActiveBreakType(null);
      setClockState('working');
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleBreakButtonClick = async () => {
    if (clockState === 'on_break') {
      await handleBreakEnd();
    } else if (clockState === 'working') {
      setShowBreakMenu((v) => !v);
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
      setActiveBreakType(null);
      setShowBreakMenu(false);
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
    danger?: boolean;
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
    danger = false,
  }) => {
    const cfg = variantConfig[variant];
    return (
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative">
          {/* Lightning pulse rings — only when active */}
          {active && !disabled && (
            <>
              <span className={`absolute inset-0 rounded-full ${danger ? 'bg-rose-400/25' : cfg.ping} animate-ping`} />
              <span className={`absolute -inset-1.5 rounded-full ${danger ? 'bg-rose-400/25 opacity-60' : `${cfg.ping} opacity-60`} animate-pulse`} />
            </>
          )}

          {/* Outer decorative dashed ring */}
          <div
            className={`absolute -inset-2 rounded-full border-2 border-dashed transition-all duration-500 ${
              active && !disabled ? `${danger ? 'border-rose-200' : cfg.border} animate-[spin_12s_linear_infinite]` : 'border-slate-200/70'
            }`}
          />

          <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full z-[1]
              bg-gradient-to-br ${danger ? 'from-rose-400 via-rose-500 to-red-600' : cfg.grad}
              ring-4 ${active && !disabled ? (danger ? 'ring-rose-400/60' : cfg.ring) : 'ring-transparent'}
              border-4 border-white/70
              ${active && !disabled ? `${danger ? 'shadow-[0_0_35px_-5px_rgba(244,63,94,0.55)]' : cfg.glow} scale-100` : 'shadow-lg'}
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
          <div className={`text-xs font-extrabold tracking-wide ${disabled ? 'text-slate-400' : danger ? 'text-rose-700' : cfg.label}`}>{label}</div>
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

  /* ---------- Active break budget progress ---------- */
  const activeBreakCfg = activeBreakType ? BREAK_TYPE_CONFIG.find((t) => t.key === activeBreakType) : null;
  const activeBreakRemainingAtStart = activeBreakType
    ? Math.max(0, budgets[activeBreakCfg!.budgetKey] - (breakMinutesByType[activeBreakCfg!.budgetKey] || 0)) * 60
    : 0;
  const breakOverLimit = liveBreakSeconds !== null && liveBreakSeconds > activeBreakRemainingAtStart;
  const breakProgress =
    liveBreakSeconds !== null && activeBreakRemainingAtStart > 0
      ? Math.min(1, liveBreakSeconds / activeBreakRemainingAtStart)
      : liveBreakSeconds !== null
      ? 1
      : 0;

  /* ---------- Per-type remaining budget ---------- */
  const remainingFor = (k: BudgetKey): number => Math.max(0, budgets[k] - (breakMinutesByType[k] || 0));
  const usedFor = (k: BudgetKey): number => breakMinutesByType[k] || 0;

  const summaryCards = [
    {
      label: 'Clock In',
      value: clockInTime || '—',
      icon: <Play className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200',
      sub: null as string | null,
    },
    {
      label: 'Clock Out',
      value: clockOutTime || '—',
      icon: <Square className="w-4 h-4 text-rose-600" />,
      color: 'bg-rose-50 border-rose-200',
      sub: null as string | null,
    },
    {
      label: 'Working Hours',
      value: liveElapsed !== null ? formatSeconds(liveElapsed) : formatMinutes(workingMinutes),
      icon: <Timer className={`w-4 h-4 text-indigo-600 ${liveElapsed !== null ? 'animate-pulse' : ''}`} />,
      color: 'bg-indigo-50 border-indigo-200',
      sub: null as string | null,
    },
    {
      label: 'Break',
      value: formatMinutes(breakMinutes),
      icon: <Coffee className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
      sub:
        breakMinutes > 0
          ? [
              usedFor('lunch') > 0 ? `L ${formatMinutes(usedFor('lunch'))}` : null,
              usedFor('namaz') > 0 ? `N ${formatMinutes(usedFor('namaz'))}` : null,
              usedFor('washroom') > 0 ? `W ${formatMinutes(usedFor('washroom'))}` : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : null,
    },
  ];

  const activeBreakLabel = activeBreakCfg ? activeBreakCfg.label : 'Break';
  const statusText =
    clockState === 'not_clocked_in'
      ? "You haven't clocked in yet — start your shift!"
      : clockState === 'working'
      ? `Working since ${clockInTime}`
      : clockState === 'on_break'
      ? `On ${activeBreakLabel} break — relaxing?`
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
                  ? `End ${activeBreakLabel.toLowerCase()} break`
                  : breakMinutes > 0
                  ? `${formatMinutes(breakMinutes)} taken`
                  : 'Take a pause'
              }
              icon={<Coffee className="w-9 h-9 drop-shadow" />}
              variant="amber"
              onClick={handleBreakButtonClick}
              disabled={clockState === 'not_clocked_in' || clockState === 'clocked_out'}
              active={clockState === 'working' || clockState === 'on_break' || showBreakMenu}
              loading={isLoading === 'break-end' || BREAK_TYPE_CONFIG.some((t) => isLoading === `break-${t.key}`)}
              danger={clockState === 'on_break' && breakOverLimit}
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

          {/* Break Type Menu — pick which break to start */}
          {showBreakMenu && clockState === 'working' && (
            <div className="mt-5 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Choose Break Type</span>
                <span className="text-[10px] font-semibold text-slate-400">Daily budgets</span>
              </div>
              <div className="p-2 space-y-1.5">
                {BREAK_TYPE_CONFIG.map((t) => {
                  const used = usedFor(t.budgetKey);
                  const remaining = remainingFor(t.budgetKey);
                  const budget = budgets[t.budgetKey];
                  const exhausted = used >= budget;
                  const blocked = exhausted && t.key !== 'LUNCH';
                  const Icon = t.icon;
                  const loadingThis = isLoading === `break-${t.key}`;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      disabled={blocked || loadingThis}
                      onClick={() => handleBreakStart(t.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                        ${blocked ? 'border-slate-100 bg-slate-50/60 opacity-55 cursor-not-allowed' : `border-slate-200/70 bg-white cursor-pointer ${t.row}`}
                        ${loadingThis ? 'animate-pulse' : ''}`}
                    >
                      <span className={`p-2 rounded-lg ${t.chip}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-xs font-bold text-slate-800">{t.label} Break</span>
                        <span className="block text-[10px] font-semibold text-slate-400">
                          {blocked
                            ? 'Daily budget used up'
                            : exhausted
                            ? 'Budget done — extra will cut from working hours'
                            : `${remaining}m left of ${budget}m`}
                        </span>
                      </span>
                      {blocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      ) : (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${exhausted ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                          {exhausted ? 'EXTRA' : `${remaining}m`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${breakOverLimit ? 'bg-rose-400' : 'bg-amber-400'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${breakOverLimit ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    </span>
                    <span className={breakOverLimit ? 'text-rose-600' : 'text-amber-600'}>
                      On Break ({activeBreakLabel}) — {formatSeconds(liveBreakSeconds || 0)}
                      {breakOverLimit
                        ? ' · Over limit!'
                        : activeBreakRemainingAtStart > 0
                        ? ` · ${formatMMSS(Math.max(0, activeBreakRemainingAtStart - (liveBreakSeconds || 0)))} left`
                        : ''}
                    </span>
                  </>
                )}
              </div>

              {/* Break budget progress bar */}
              {clockState === 'on_break' && activeBreakCfg && (
                <div className="w-full max-w-xs space-y-1">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${breakOverLimit ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                      style={{ width: `${Math.round(breakProgress * 100)}%` }}
                    />
                  </div>
                  {breakOverLimit && (
                    <p className="text-center text-[10px] font-bold text-rose-600">
                      Over daily budget — extra minutes deducted from working hours
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Budget chips summary (while working) */}
          {clockState === 'working' && !showBreakMenu && (
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              {BREAK_TYPE_CONFIG.map((t) => {
                const remaining = remainingFor(t.budgetKey);
                const exhausted = remaining <= 0;
                const Icon = t.icon;
                return (
                  <span
                    key={t.key}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      exhausted ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${exhausted ? 'text-slate-300' : 'text-slate-500'}`} />
                    {t.label} {exhausted ? 'used' : `${remaining}m`}
                  </span>
                );
              })}
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

          {/* Collapse hint for the menu */}
          {showBreakMenu && clockState === 'working' && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowBreakMenu(false)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" /> Hide break options
              </button>
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
              {card.sub && <div className="text-[10px] font-bold text-slate-400 mt-0.5">{card.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
