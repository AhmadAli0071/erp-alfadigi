import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { ClockButtonsCard } from '../attendance/ClockButtonsCard';
import { User } from '../../types/auth';
import {
  Building2,
  Coffee,
  Clock,
  RefreshCw,
  AlertCircle,
  Crown,
  LogIn,
  LogOut as LogOutIcon,
  Timer,
  UserX,
  CalendarOff,
  Users,
  Sparkles,
  Activity,
  TrendingUp,
  BarChart3,
  Trophy,
  Lock,
} from 'lucide-react';

interface PersonAttendance {
  clockIn: string | null;
  clockInAt: string | null;
  clockOut: string | null;
  workingMinutes: number;
  breakMinutes: number;
  onBreak: boolean;
  breakType: string | null;
  breakStartedAt: string | null;
  status: string | null;
}

interface Person {
  employeeId: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  avatar: string;
  empStatus: string;
  attendance: PersonAttendance;
}

interface Section {
  department: string;
  totals: { staff: number; clockedIn: number; completed: number; onBreak: number; notIn: number; onLeave: number };
  leads: Person[];
  employees: Person[];
}

interface OverviewData {
  date: string;
  serverTime: string;
  summary: { totalStaff: number; clockedIn: number; onBreak: number; notIn: number; onLeave: number };
  sections: Section[];
}

type TabKey = 'overview' | 'Tech' | 'Sales' | 'HR';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const fmtMins = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

const BREAK_LABEL: Record<string, string> = { LUNCH: 'Lunch', NAMAZ: 'Namaz', WASHROOM: 'Washroom' };

const BREAK_CHIP: Record<string, string> = {
  LUNCH: 'bg-orange-100/80 text-orange-700 border-orange-200',
  NAMAZ: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  WASHROOM: 'bg-sky-100/80 text-sky-700 border-sky-200',
};

const DEPT_META: Record<string, { accent: string; chip: string; dot: string }> = {
  Tech: { accent: 'from-indigo-500 to-violet-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  Sales: { accent: 'from-emerald-500 to-teal-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  HR: { accent: 'from-purple-500 to-fuchsia-500', chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const BREAK_PILL: Record<string, string> = {
  LUNCH: 'bg-orange-100/80 text-orange-700 border-orange-200',
  NAMAZ: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  WASHROOM: 'bg-sky-100/80 text-sky-700 border-sky-200',
};

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-fuchsia-600',
];

const gradientFor = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

/* ---------------- Charts (pure SVG, no deps) ---------------- */

const DonutChart: React.FC<{ segs: { label: string; value: number; color: string }[] }> = ({ segs }) => {
  const R = 54;
  const C = 2 * Math.PI * R;
  const totalVal = segs.reduce((n, s) => n + s.value, 0);
  const GAP = totalVal > 0 ? 3 : 0;
  let acc = 0;
  return (
    <div className="relative">
      <svg viewBox="0 0 140 140" className="w-36 h-36 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f5f9" strokeWidth="15" />
        {segs.map((s, i) => {
          if (s.value <= 0 || totalVal === 0) return null;
          const frac = s.value / totalVal;
          const len = Math.max(frac * C - GAP, 1.5);
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="15"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc * C}
              className="transition-all duration-700"
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900">{totalVal}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">staff</span>
      </div>
    </div>
  );
};

const RushChart: React.FC<{ buckets: { label: string; count: number }[] }> = ({ buckets }) => {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {buckets.map((b, i) => {
        const hPct = (b.count / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className={`text-[9px] font-extrabold ${b.count > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{b.count || ''}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '76px' }}>
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${b.count > 0 ? 'bg-gradient-to-t from-indigo-600 to-violet-400 group-hover:from-indigo-500 group-hover:to-fuchsia-400' : 'bg-slate-100'}`}
                style={{ height: `${Math.max(hPct, b.count > 0 ? 8 : 4)}%` }}
                title={`${b.label}: ${b.count} clock-ins`}
              />
            </div>
            <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const DeptLoadChart: React.FC<{ rows: { dept: string; in: number; total: number; accent: string }[] }> = ({ rows }) => (
  <div className="space-y-3.5">
    {rows.map((r) => {
      const pct = r.total > 0 ? Math.round((r.in / r.total) * 100) : 0;
      return (
        <div key={r.dept}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${r.accent.replace('from-', 'bg-').split(' ')[0]}`} />
              {r.dept}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 font-mono">{r.in}/{r.total} · {pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200/70 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${r.accent} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const TopHoursChart: React.FC<{ rows: { name: string; dept: string; mins: number; live: boolean }[] }> = ({ rows }) => {
  const max = Math.max(...rows.map((r) => r.mins), 1);
  if (rows.length === 0) {
    return <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-medium">No clock-ins yet today.</div>;
  }
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-extrabold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 truncate flex items-center gap-1">
                {r.name}
                {r.live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              </span>
              <span className="text-[10px] font-extrabold text-slate-500 font-mono shrink-0 ml-2">{fmtMins(r.mins)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 border border-slate-200/70 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : `bg-gradient-to-r ${gradientFor(r.name)}`}`}
                style={{ width: `${Math.max((r.mins / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------------- Main view ---------------- */

export const HODDashboardView: React.FC<{ user: User }> = ({ user }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [pktClock, setPktClock] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  useEffect(() => {
    const t = setInterval(() => {
      setNowTick(Date.now());
      setPktClock(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fetchOverview = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/hod/overview`, { headers: getHeaders() });
      if (!res.ok) throw new Error('failed');
      setData(await res.json());
    } catch {
      setError('Unable to load live overview.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    const t = setInterval(fetchOverview, 30000);
    return () => clearInterval(t);
  }, [fetchOverview]);

  useRealtimeRefresh(fetchOverview);

  const liveMinutes = (p: Person): number => {
    const a = p.attendance;
    if (!a.clockInAt) return a.workingMinutes;
    if (a.clockOut) return a.workingMinutes;
    let mins = Math.floor((nowTick - new Date(a.clockInAt).getTime()) / 60000);
    mins -= a.breakMinutes || 0;
    if (a.onBreak && a.breakStartedAt) mins -= Math.floor((nowTick - new Date(a.breakStartedAt).getTime()) / 60000);
    return Math.max(0, mins);
  };

  const breakMinutesLive = (p: Person): number | null => {
    const a = p.attendance;
    if (!a.onBreak || !a.breakStartedAt) return null;
    return Math.max(0, Math.floor((nowTick - new Date(a.breakStartedAt).getTime()) / 60000));
  };

  const allPeople: Person[] = data ? data.sections.flatMap((s) => [...s.leads, ...s.employees]) : [];

  const donutSegs = data
    ? [
        { label: 'Working', value: allPeople.filter((p) => p.attendance.clockIn && !p.attendance.clockOut && !p.attendance.onBreak && p.empStatus !== 'On Leave').length, color: '#10b981' },
        { label: 'On Break', value: data.summary.onBreak, color: '#f59e0b' },
        { label: 'Shift Done', value: allPeople.filter((p) => p.attendance.clockOut).length, color: '#94a3b8' },
        { label: 'Not In', value: data.summary.notIn, color: '#f43f5e' },
        { label: 'On Leave', value: data.summary.onLeave, color: '#3b82f6' },
      ]
    : [];

  const rushBuckets = React.useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const h = (16 + i) % 24;
      return { h, count: 0, label: `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}` };
    });
    allPeople.forEach((p) => {
      if (!p.attendance.clockInAt) return;
      const pktH = (new Date(p.attendance.clockInAt).getUTCHours() + 5) % 24;
      const b = buckets.find((x) => x.h === pktH);
      if (b) b.count++;
    });
    return buckets.map(({ label, count }) => ({ label, count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const topHours = [...allPeople]
    .filter((p) => p.attendance.clockIn)
    .sort((a, b) => liveMinutes(b) - liveMinutes(a))
    .slice(0, 5)
    .map((p) => ({ name: p.name, dept: p.department, mins: liveMinutes(p), live: !p.attendance.clockOut && !p.attendance.onBreak }));

  const notInPeople = allPeople.filter((p) => !p.attendance.clockIn && p.empStatus === 'Active');
  const onLeavePeople = allPeople.filter((p) => p.empStatus === 'On Leave');
  const attentionPeople: { p: Person; kind: 'notin' | 'leave' }[] = [
    ...notInPeople.map((p) => ({ p, kind: 'notin' as const })),
    ...onLeavePeople.map((p) => ({ p, kind: 'leave' as const })),
  ];

  const deptLoad = (data?.sections || []).map((s) => ({
    dept: s.department,
    in: s.totals.clockedIn,
    total: s.totals.staff,
    accent: DEPT_META[s.department]?.accent || 'from-slate-500 to-slate-400',
  }));

  const PersonStatusPill: React.FC<{ p: Person }> = ({ p }) => {
    const a = p.attendance;
    if (p.empStatus === 'On Leave') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-[9px] font-bold uppercase tracking-wide">
          <CalendarOff className="w-3 h-3" /> On Leave
        </span>
      );
    }
    if (a.onBreak) {
      const label = a.breakType ? BREAK_LABEL[a.breakType] || a.breakType : 'Break';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide animate-pulse ${BREAK_PILL[a.breakType || ''] || 'bg-amber-100/80 text-amber-700 border-amber-200'}`}>
          <Coffee className="w-3 h-3" /> {label} · {breakMinutesLive(p)}m
        </span>
      );
    }
    if (a.clockIn && !a.clockOut) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Working
        </span>
      );
    }
    if (a.clockOut) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wide">
          <LogOutIcon className="w-3 h-3" /> Shift Done
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-600 text-[9px] font-bold uppercase tracking-wide">
        <UserX className="w-3 h-3" /> Not Clocked In
      </span>
    );
  };

  const Avatar: React.FC<{ p: Person; size: string; premium?: boolean }> = ({ p, size, premium }) =>
    p.avatar ? (
      <img src={p.avatar} alt={p.name} className={`${size} rounded-xl object-cover ${premium ? 'ring-2 ring-amber-400/60' : 'ring-1 ring-slate-200'}`} />
    ) : (
      <div className={`${size} rounded-xl bg-gradient-to-br ${gradientFor(p.email)} flex items-center justify-center text-white font-extrabold ${premium ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20' : 'ring-1 ring-slate-200/80'} shrink-0`}>
        {initials(p.name)}
      </div>
    );

  const LeadCard: React.FC<{ p: Person }> = ({ p }) => {
    const a = p.attendance;
    const live = liveMinutes(p);
    return (
      <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-amber-400/70 via-amber-200/40 to-amber-400/30 shadow-lg shadow-amber-500/10">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-4 h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar p={p} size="w-11 h-11" premium />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white truncate">{p.name}</span>
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <div className="text-[10px] text-amber-200/70 font-semibold truncate">{p.jobTitle} · {p.empId}</div>
              </div>
            </div>
            <div className="shrink-0"><PersonStatusPill p={p} /></div>
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.05] border border-white/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400"><LogIn className="w-3 h-3" /> In</div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">{a.clockIn || '-'}</div>
            </div>
            <div className="rounded-xl bg-white/[0.05] border border-white/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400"><LogOutIcon className="w-3 h-3" /> Out</div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">{a.clockOut || (a.clockIn ? '—' : '-')}</div>
            </div>
            <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-300/80"><Timer className="w-3 h-3" /> Hours</div>
              <div className="text-xs font-bold text-amber-200 font-mono mt-0.5">{a.clockIn ? fmtMins(live) : '-'}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium truncate">{p.email}</span>
            <span className="text-slate-400 font-semibold shrink-0 ml-2">Break: <span className="text-slate-200 font-mono">{fmtMins(a.breakMinutes || 0)}</span></span>
          </div>
        </div>
      </div>
    );
  };

  const EmployeeCard: React.FC<{ p: Person }> = ({ p }) => {
    const a = p.attendance;
    const live = liveMinutes(p);
    return (
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-3.5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar p={p} size="w-9 h-9" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
              <div className="text-[10px] text-slate-500 font-medium truncate">{p.jobTitle} · {p.empId}</div>
            </div>
          </div>
          <PersonStatusPill p={p} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 py-1.5">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">In</div>
            <div className="text-[10px] font-bold text-slate-700 font-mono">{a.clockIn || '-'}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 py-1.5">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Out</div>
            <div className="text-[10px] font-bold text-slate-700 font-mono">{a.clockOut || '-'}</div>
          </div>
          <div className={`rounded-lg border py-1.5 ${a.clockIn ? 'bg-indigo-50/60 border-indigo-200/70' : 'bg-slate-50 border-slate-200/70'}`}>
            <div className="flex items-center justify-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400"><Timer className="w-2.5 h-2.5" /> Hrs</div>
            <div className={`text-[10px] font-bold font-mono ${a.clockIn ? 'text-indigo-700' : 'text-slate-500'}`}>{a.clockIn ? fmtMins(live) : '-'}</div>
          </div>
        </div>
      </div>
    );
  };

  const kpis = data
    ? [
        { label: 'Total Staff', value: data.summary.totalStaff, icon: <Users className="w-4 h-4 text-slate-600" />, bg: 'bg-white/80 border-slate-200/80' },
        { label: 'Clocked In', value: data.summary.clockedIn, icon: <LogIn className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
        { label: 'On Break', value: data.summary.onBreak, icon: <Coffee className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
        { label: 'Not Clocked In', value: data.summary.notIn, icon: <UserX className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
        { label: 'On Leave', value: data.summary.onLeave, icon: <CalendarOff className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
      ]
    : [];

  const activeSection = data?.sections.find((s) => s.department === tab);
  const deptTotals = activeSection?.totals;

  const isLocked = (key: TabKey): boolean =>
    user.role === 'HOD' && (key === 'Sales' || key === 'HR');

  const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-3.5">
        {icon}
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">{title}</h3>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Company Pulse</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Every department, every lead, every employee — in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end px-3.5 py-2 rounded-xl bg-slate-900 text-white shadow-lg">
            <span className="text-sm font-extrabold font-mono leading-none">{pktClock || '—'}</span>
            <span className="text-[9px] font-semibold text-amber-300/80 tracking-widest uppercase mt-1">Pakistan Time</span>
          </div>
          <button
            onClick={fetchOverview}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* My Shift Today - HOD clock-in/out like every other employee */}
      <ClockButtonsCard user={user} title="My Shift Today" />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/70 overflow-x-auto">
        {([
          { key: 'overview' as TabKey, label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
          { key: 'Tech' as TabKey, label: 'Tech', icon: <Building2 className="w-3.5 h-3.5" /> },
          { key: 'Sales' as TabKey, label: 'Sales', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { key: 'HR' as TabKey, label: 'HR', icon: <Users className="w-3.5 h-3.5" /> },
        ]).map((t) => {
          const locked = isLocked(t.key);
          return (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            title={locked ? 'Restricted department' : undefined}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              tab === t.key
                ? locked
                  ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                  : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : locked
                  ? 'text-slate-400 hover:text-slate-500 hover:bg-white/60'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : t.icon}
            {t.label}
            {!locked && t.key !== 'overview' && data && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${tab === t.key ? 'bg-white/15 text-amber-300' : 'bg-slate-200/70 text-slate-500'}`}>
                {data.sections.find((s) => s.department === t.key)?.totals.staff ?? 0}
              </span>
            )}
          </button>
          );
        })}
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : error && !data ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchOverview} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
        </div>
      ) : tab === 'overview' ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${k.bg} backdrop-blur-xl shadow-sm flex items-center justify-between`}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k.label}</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{k.value}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/70 border border-slate-200/60">{k.icon}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Workforce Status" icon={<Activity className="w-3.5 h-3.5 text-indigo-500" />}>
              <div className="flex items-center gap-5">
                <DonutChart segs={donutSegs} />
                <div className="space-y-2 flex-1">
                  {donutSegs.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-extrabold font-mono text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Clock-in Rush (PKT)" icon={<Clock className="w-3.5 h-3.5 text-violet-500" />}>
              <RushChart buckets={rushBuckets} />
            </Card>

            <div className="space-y-4">
              <Card title="Department Load" icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-500" />}>
                <DeptLoadChart rows={deptLoad} />
              </Card>
              <Card title="Top Hours Today" icon={<Trophy className="w-3.5 h-3.5 text-amber-500" />}>
                <TopHoursChart rows={topHours} />
              </Card>
            </div>
          </div>

          {/* Needs attention: not clocked in + on leave */}
          <Card
            title={`Needs Attention · ${attentionPeople.length}`}
            icon={<AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
          >
            {attentionPeople.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs font-bold text-emerald-600">
                <Sparkles className="w-4 h-4" /> Full attendance — everyone is in!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {attentionPeople.map(({ p, kind }) => {
                  const meta = DEPT_META[p.department] || DEPT_META.Tech;
                  return (
                    <div key={p.employeeId} className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 px-3 py-2.5">
                      <Avatar p={p} size="w-8 h-8" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-800 truncate">{p.name}</div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">{p.jobTitle} · {p.empId}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-extrabold uppercase tracking-wide ${kind === 'leave' ? 'bg-blue-100/80 text-blue-700 border-blue-200' : 'bg-rose-100/80 text-rose-600 border-rose-200 animate-pulse'}`}>
                          {kind === 'leave' ? 'On Leave' : 'Not Clocked In'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 rounded-full border text-[8px] font-bold ${meta.chip}`}>
                          <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
                          {p.department}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      ) : isLocked(tab) ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-14 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">Department Restricted</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            The <strong>{tab}</strong> department view is locked for your role. Company Overview and Tech stay available.
          </p>
        </div>
      ) : activeSection ? (
        <>
          {/* Dept mini KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Staff', value: deptTotals?.staff ?? 0, cls: 'bg-white/80 border-slate-200/80 text-slate-900' },
              { label: 'Clocked In', value: deptTotals?.clockedIn ?? 0, cls: 'bg-emerald-500/[0.04] border-emerald-200 text-emerald-700' },
              { label: 'On Break', value: deptTotals?.onBreak ?? 0, cls: 'bg-amber-500/[0.04] border-amber-200 text-amber-700' },
              { label: 'Not In', value: deptTotals?.notIn ?? 0, cls: 'bg-rose-500/[0.04] border-rose-200 text-rose-600' },
              { label: 'On Leave', value: deptTotals?.onLeave ?? 0, cls: 'bg-blue-500/[0.04] border-blue-200 text-blue-700' },
            ].map((k, i) => (
              <div key={i} className={`p-3.5 rounded-2xl border ${k.cls} backdrop-blur-xl shadow-sm`}>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{k.label}</div>
                <div className="text-xl font-extrabold mt-0.5">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Leads */}
          {activeSection.leads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Leads & Managers</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 rounded-2xl p-3.5 bg-gradient-to-br from-slate-100/60 to-transparent border border-slate-200/60">
                {activeSection.leads.map((p) => <LeadCard key={p.employeeId} p={p} />)}
              </div>
            </div>
          )}

          {/* Employees */}
          {activeSection.employees.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Employees</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeSection.employees.map((p) => <EmployeeCard key={p.employeeId} p={p} />)}
              </div>
            </div>
          )}

          {activeSection.leads.length === 0 && activeSection.employees.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-400 font-medium">
              No staff in this department yet.
            </div>
          )}
        </>
      ) : null}

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
        <Clock className="w-3 h-3" /> Auto-refreshes every 30 seconds · {data?.date}
      </div>
    </div>
  );
};
