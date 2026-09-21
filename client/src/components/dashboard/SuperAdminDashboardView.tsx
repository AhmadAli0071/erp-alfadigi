import React, { useState, useEffect, useCallback } from 'react';
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
  department: 'HR' | 'Sales' | 'Tech';
  status: string;
  isActive: boolean;
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

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ user, onNavigate }) => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getHeaders();
      const [accRes, empRes, leaveRes, ticketRes] = await Promise.all([
        fetch(`${API_BASE}/auth/accounts`, { headers: token }),
        fetch(`${API_BASE}/employees?includeInactive=1`, { headers: token }),
        fetch(`${API_BASE}/leaves/hr-count`, { headers: token }),
        fetch(`${API_BASE}/tickets/hr-count`, { headers: token }),
      ]);
      if (accRes.ok) setAccounts((await accRes.json()).accounts || []);
      if (empRes.ok) setEmployees((await empRes.json()).employees || []);
      if (leaveRes.ok) setPendingLeaves((await leaveRes.json()).count || 0);
      if (ticketRes.ok) setOpenTickets((await ticketRes.json()).count || 0);
    } catch {
      setError('Some system stats could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const countRole = (r: AccountRow['role']) => accounts.filter((a) => a.role === r).length;
  const countDept = (d: string) => employees.filter((e) => e.department === d).length;
  const activeEmployees = employees.filter((e) => e.isActive).length;

  const kpiCards = [
    { label: 'Total Employees', value: employees.length, sub: `${activeEmployees} active`, icon: <Users className="w-4 h-4 text-rose-300" />, accent: 'from-rose-500/20 to-transparent border-rose-400/20' },
    { label: 'User Accounts', value: accounts.length, sub: `${countRole('SUPER_ADMIN')} super admin`, icon: <UserCheck className="w-4 h-4 text-indigo-300" />, accent: 'from-indigo-500/20 to-transparent border-indigo-400/20' },
    { label: 'Pending Leaves', value: pendingLeaves, sub: 'awaiting action', icon: <CalendarDays className="w-4 h-4 text-amber-300" />, accent: 'from-amber-500/20 to-transparent border-amber-400/20' },
    { label: 'Open Tickets', value: openTickets, sub: 'in pipeline', icon: <Ticket className="w-4 h-4 text-sky-300" />, accent: 'from-sky-500/20 to-transparent border-sky-400/20' },
  ];

  const roleCards = [
    { role: 'SUPER_ADMIN' as const, label: 'Super Admins', icon: <Crown className="w-4 h-4 text-rose-300" />, chip: 'border-rose-400/30 bg-rose-500/10 text-rose-200' },
    { role: 'HR_ADMIN' as const, label: 'HR Admins', icon: <ShieldCheck className="w-4 h-4 text-indigo-300" />, chip: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200' },
    { role: 'DEPARTMENT_LEAD' as const, label: 'Dept Leads', icon: <UserCog className="w-4 h-4 text-sky-300" />, chip: 'border-sky-400/30 bg-sky-500/10 text-sky-200' },
    { role: 'EMPLOYEE' as const, label: 'Employees', icon: <UserCheck className="w-4 h-4 text-emerald-300" />, chip: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
  ];

  const deptCards = [
    { dept: 'HR', count: countDept('HR') },
    { dept: 'Sales', count: countDept('Sales') },
    { dept: 'Tech', count: countDept('Tech') },
  ];

  const quickActions = [
    { label: 'Users & Roles', desc: 'Govern every login account', route: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Employees', desc: 'Directory & lifecycle', route: '/admin/employees', icon: <Database className="w-4 h-4" /> },
    { label: 'Attendance', desc: 'Company-wide records', route: '/admin/attendance', icon: <CalendarDays className="w-4 h-4" /> },
    { label: 'Settings', desc: 'System policies', route: '/admin/settings', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Hero — Super Admin identity */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-rose-400/20 p-6 sm:p-8 backdrop-blur">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-xl shadow-rose-500/30 ring-1 ring-rose-400/40">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-400/30 mb-1.5">
                <Crown className="w-3 h-3 text-rose-300" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-300">Super Admin</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Full system control — all departments, all data, all settings.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            disabled={isLoading}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs font-bold text-amber-200">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((c) => (
          <div key={c.label} className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${c.accent} bg-slate-900/60 border backdrop-blur`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">{c.icon}</div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">{isLoading ? '…' : c.value}</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{c.label}</div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Role governance */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-white">Role Governance</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Accounts by access level</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/users')}
              className="inline-flex items-center gap-1 text-[10px] font-black text-rose-300 hover:text-rose-200 cursor-pointer"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {roleCards.map((r) => (
              <div key={r.role} className={`flex items-center gap-3 p-3 rounded-xl border ${r.chip}`}>
                {r.icon}
                <div className="min-w-0">
                  <div className="text-lg font-black leading-none">{isLoading ? '…' : countRole(r.role)}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider opacity-70 mt-0.5">{r.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-white">Departments</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Workforce distribution</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-2.5">
            {deptCards.map((d) => {
              const pct = employees.length ? Math.round((d.count / employees.length) * 100) : 0;
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 mb-1">
                    <span className="uppercase tracking-wider">{d.dept}</span>
                    <span>{isLoading ? '…' : `${d.count} · ${pct}%`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-700"
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
        <h3 className="text-sm font-black text-white mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((a) => (
            <button
              key={a.route}
              type="button"
              onClick={() => onNavigate(a.route)}
              className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-left hover:border-rose-400/40 hover:bg-rose-500/5 transition-all group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 w-fit mb-3 group-hover:scale-110 transition-transform">
                {a.icon}
              </div>
              <div className="text-xs font-black text-white">{a.label}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
