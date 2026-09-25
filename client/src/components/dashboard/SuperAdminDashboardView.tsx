import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { User } from '../../types/auth';
import {
  Crown,
  ShieldCheck,
  Users,
  UserCheck,
  CalendarDays,
  Ticket,
  RefreshCw,
  AlertCircle,
  Building2,
  ArrowRight,
  Database,
  UserCog,
  Zap,
  Wallet,
  Check,
  X,
} from 'lucide-react';

interface SuperAdminDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'DEPARTMENT_LEAD' | 'EMPLOYEE';
  isActive: boolean;
}

interface EmployeeRow {
  id: string;
  name: string;
  department: string;
  status: string;
  isActive: boolean;
}

interface SalaryRequestRow {
  id: string;
  employeeName: string;
  employeeEmail: string;
  currentSalary: number;
  newSalary: number;
  reason?: string;
  requestedByName: string;
  requestedByEmail: string;
  status: 'Pending' | 'Approved' | 'Rejected';
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

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ user, onNavigate }) => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [salaryRequests, setSalaryRequests] = useState<SalaryRequestRow[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getHeaders();
      const [accRes, empRes, leaveRes, ticketRes, salRes] = await Promise.all([
        fetch(`${API_BASE}/auth/accounts`, { headers: token }),
        fetch(`${API_BASE}/employees?includeInactive=1`, { headers: token }),
        fetch(`${API_BASE}/leaves/hr-count`, { headers: token }),
        fetch(`${API_BASE}/tickets/hr-count`, { headers: token }),
        fetch(`${API_BASE}/salary-requests?status=Pending`, { headers: token }),
      ]);
      if (accRes.ok) setAccounts((await accRes.json()).accounts || []);
      if (empRes.ok) setEmployees((await empRes.json()).employees || []);
      if (leaveRes.ok) setPendingLeaves((await leaveRes.json()).count || 0);
      if (ticketRes.ok) setOpenTickets((await ticketRes.json()).count || 0);
      if (salRes.ok) setSalaryRequests((await salRes.json()).requests || []);
    } catch {
      setError('Some system stats could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live refresh: SSE notification ya window focus par refetch
  useRealtimeRefresh(fetchAll);

  const reviewSalaryRequest = useCallback(async (id: string, action: 'approve' | 'reject') => {
    setReviewingId(id);
    try {
      await fetch(`${API_BASE}/salary-requests/${id}/${action}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      setSalaryRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore - refetch will resync
    } finally {
      setReviewingId(null);
    }
  }, []);

  const countRole = (r: AccountRow['role']) => accounts.filter((a) => a.role === r).length;
  const activeEmployees = employees.filter((e) => e.isActive).length;

  const deptCards = (() => {
    const counts = new Map<string, number>();
    for (const e of employees) {
      const key = e.department?.trim() || 'Unassigned';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const kpiCards = [
    { label: 'Total Employees', value: employees.length, sub: `${activeEmployees} active`, icon: <Users className="w-4 h-4" />, color: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20', route: '/admin/employees' },
    { label: 'User Accounts', value: accounts.length, sub: `${countRole('SUPER_ADMIN')} super admin`, icon: <UserCheck className="w-4 h-4" />, color: 'text-teal-300 bg-teal-400/10 border-teal-400/20', route: '/admin/users' },
    { label: 'Pending Leaves', value: pendingLeaves, sub: 'awaiting action', icon: <CalendarDays className="w-4 h-4" />, color: 'text-amber-300 bg-amber-400/10 border-amber-400/20', route: '/admin/leaves' },
    { label: 'Open Tickets', value: openTickets, sub: 'in pipeline', icon: <Ticket className="w-4 h-4" />, color: 'text-violet-300 bg-violet-400/10 border-violet-400/20', route: '/admin/tickets' },
  ];

  const roleCards = [
    { role: 'SUPER_ADMIN' as const, label: 'Super Admins', icon: <Crown className="w-4 h-4 text-amber-300" />, chip: 'bg-amber-400/[0.06] border-amber-400/20' },
    { role: 'HR_ADMIN' as const, label: 'HR Admins', icon: <ShieldCheck className="w-4 h-4 text-indigo-300" />, chip: 'bg-indigo-400/[0.06] border-indigo-400/20' },
    { role: 'DEPARTMENT_LEAD' as const, label: 'Dept Leads', icon: <UserCog className="w-4 h-4 text-sky-300" />, chip: 'bg-sky-400/[0.06] border-sky-400/20' },
    { role: 'EMPLOYEE' as const, label: 'Employees', icon: <UserCheck className="w-4 h-4 text-emerald-300" />, chip: 'bg-emerald-400/[0.06] border-emerald-400/20' },
  ];

  const quickActions = [
    { label: 'Users & Roles', desc: 'Govern every login account', route: '/admin/users', icon: <Users className="w-4 h-4" />, color: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20' },
    { label: 'Employees', desc: 'Directory & lifecycle', route: '/admin/employees', icon: <Database className="w-4 h-4" />, color: 'text-teal-300 bg-teal-400/10 border-teal-400/20' },
    { label: 'Attendance', desc: 'Company-wide records', route: '/admin/attendance', icon: <CalendarDays className="w-4 h-4" />, color: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    { label: 'Settings', desc: 'System policies', route: '/admin/settings', icon: <Zap className="w-4 h-4" />, color: 'text-violet-300 bg-violet-400/10 border-violet-400/20' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Crown className="w-4 h-4 text-slate-950" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-300 border border-amber-400/20">
              Super Admin
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            {getGreeting()}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Full system control. All departments, all data, all settings.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAll}
          disabled={isLoading}
          className="self-start p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] text-slate-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-400/10 border border-rose-400/20 text-xs font-bold text-rose-300">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.route)}
            className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] text-left hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all cursor-pointer group"
          >
            <div className={`inline-flex p-2 rounded-lg border mb-2.5 ${c.color}`}>
              {c.icon}
            </div>
            <div className="text-lg font-extrabold text-white leading-none">{isLoading ? '…' : c.value}</div>
            <div className="text-[11px] font-bold text-slate-300 mt-1.5">{c.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>
          </button>
        ))}
      </div>

      {/* Salary Change Requests - HR requests awaiting Super Admin approval */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-400/10 border border-teal-400/20 text-teal-300">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Salary Change Requests</h3>
              <p className="text-[11px] text-slate-500">Requests from HR, salary updates as soon as you approve</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${salaryRequests.length > 0 ? 'bg-teal-400/10 text-teal-300 border-teal-400/20' : 'bg-white/[0.04] text-slate-500 border-white/[0.08]'}`}>
            {salaryRequests.length} pending
          </span>
        </div>

        {salaryRequests.length > 0 ? (
          <div className="space-y-2.5">
            {salaryRequests.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{r.employeeName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{r.employeeEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-500">Rs {r.currentSalary.toLocaleString('en-US')}</span>
                    <ArrowRight className="w-3 h-3 text-teal-400" />
                    <span className="text-[11px] font-extrabold text-teal-300">Rs {r.newSalary.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-slate-500">· requested by {r.requestedByName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={reviewingId === r.id}
                    onClick={() => reviewSalaryRequest(r.id, 'approve')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[11px] font-bold hover:bg-emerald-400/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === r.id}
                    onClick={() => reviewSalaryRequest(r.id, 'reject')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-300 text-[11px] font-bold hover:bg-rose-400/20 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 font-medium py-2">
            {isLoading ? 'Loading…' : 'No pending salary requests. All clear.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Role governance */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Role Governance</h3>
              <p className="text-[11px] text-slate-500">Accounts by access level</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/users')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {roleCards.map((r) => (
              <div key={r.role} className={`flex items-center gap-3 p-3 rounded-xl border ${r.chip}`}>
                {r.icon}
                <div className="min-w-0">
                  <div className="text-lg font-extrabold leading-none text-white">{isLoading ? '…' : countRole(r.role)}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{r.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Departments</h3>
              <p className="text-[11px] text-slate-500">Workforce distribution</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-2.5">
            {deptCards.map((d) => {
              const pct = employees.length ? Math.round((d.count / employees.length) * 100) : 0;
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span className="uppercase tracking-wider">{d.dept}</span>
                    <span>{isLoading ? '…' : `${d.count} · ${pct}%`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Access</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((a) => (
            <button
              key={a.route}
              type="button"
              onClick={() => onNavigate(a.route)}
              className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] text-left hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all group cursor-pointer"
            >
              <div className={`p-2 rounded-lg border w-fit mb-3 group-hover:scale-110 transition-transform ${a.color}`}>
                {a.icon}
              </div>
              <div className="text-xs font-bold text-white">{a.label}</div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
