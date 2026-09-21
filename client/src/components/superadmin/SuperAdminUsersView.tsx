import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../../types/auth';
import { HRCreateUserModal } from '../hr/HRCreateUserModal';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Crown,
  UserCog,
  UserCheck,
  Mail,
  UserPlus,
  KeyRound,
  Power,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  jobTitle: string;
  isActive: boolean;
  createdAt: string;
}

interface SuperAdminUsersViewProps {
  user: User;
  onNavigateToDashboard: () => void;
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

const ROLE_META: Record<UserRole, { label: string; chip: string; icon: React.FC<{ className?: string }> }> = {
  SUPER_ADMIN: { label: 'Super Admin', chip: 'bg-rose-500/15 text-rose-300 border-rose-400/30', icon: Crown },
  HR_ADMIN: { label: 'HR Admin', chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30', icon: ShieldCheck },
  DEPARTMENT_LEAD: { label: 'Dept Lead', chip: 'bg-sky-500/15 text-sky-300 border-sky-400/30', icon: UserCog },
  EMPLOYEE: { label: 'Employee', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', icon: UserCheck },
};

const ALL_ROLES: UserRole[] = ['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'EMPLOYEE'];

const generatePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const SuperAdminUsersView: React.FC<SuperAdminUsersViewProps> = ({ user: currentUser, onNavigateToDashboard }) => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<AccountRow | null>(null);
  const [resetPassword, setResetPassword] = useState(generatePassword());
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSuper = currentUser.role === 'SUPER_ADMIN';

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/accounts`, { headers: getHeaders() });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      setError('Unable to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const updateStatus = async (acc: AccountRow, isActive: boolean) => {
    setBusyId(acc.id);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/accounts/${acc.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Status update failed.');
      } else {
        setAccounts((prev) => prev.map((a) => (a.id === acc.id ? { ...a, isActive } : a)));
      }
    } catch {
      setActionError('Unable to connect to server.');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (acc: AccountRow, role: UserRole) => {
    setBusyId(acc.id);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/accounts/${acc.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Role change failed.');
      } else {
        setAccounts((prev) => prev.map((a) => (a.id === acc.id ? { ...a, role } : a)));
      }
    } catch {
      setActionError('Unable to connect to server.');
    } finally {
      setBusyId(null);
    }
  };

  const doPasswordReset = async () => {
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/accounts/${resetTarget.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Password reset failed.');
      } else {
        setResetTarget(null);
        setCopied(false);
      }
    } catch {
      setActionError('Unable to connect to server.');
    } finally {
      setBusyId(null);
    }
  };

  const copyResetPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const filtered = accounts
    .filter((a) => roleFilter === 'ALL' || a.role === roleFilter)
    .filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q);
    });

  const countByRole = (r: UserRole) => accounts.filter((a) => a.role === r).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30">
              <Users className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Users & Roles Governance</h1>
              <p className="text-[11px] text-slate-500 font-medium">Create, govern and manage every login account</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAccounts}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-black shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Role summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ALL_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const Icon = meta.icon;
          return (
            <div key={r} className={`p-4 rounded-2xl bg-slate-900/60 border backdrop-blur ${meta.chip}`}>
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4" />
                <span className="text-lg font-black">{countByRole(r)}</span>
              </div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-wider opacity-80">{meta.label}s</div>
            </div>
          );
        })}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/30 text-xs font-bold text-rose-200">
          <AlertCircle className="w-4 h-4" /> {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-400/40 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
          className="appearance-none px-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/40"
        >
          <option value="ALL">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_META[r].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-rose-300">{error}</p>
            <button onClick={fetchAccounts} className="mt-2 text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs font-semibold text-slate-500">No accounts match this filter.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white/[0.03] border-b border-white/10">
                  <th className="px-5 py-3.5">Account</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((a) => {
                  const meta = ROLE_META[a.role];
                  const Icon = meta.icon;
                  const isSelf = a.id === currentUser.id;
                  const canManage = isSuper || a.role !== 'SUPER_ADMIN';
                  const busy = busyId === a.id;
                  return (
                    <tr key={a.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-black text-[10px] shrink-0">
                            {a.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              {a.name}
                              {isSelf && <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-white/10 text-slate-400">you</span>}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                              <Mail className="w-2.5 h-2.5" /> {a.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isSuper && !isSelf ? (
                          <select
                            value={a.role}
                            disabled={busy}
                            onChange={(e) => changeRole(a, e.target.value as UserRole)}
                            className={`appearance-none px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/40 ${meta.chip} bg-slate-900`}
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r} className="bg-slate-900">{ROLE_META[r].label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black ${meta.chip}`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-400">{a.department || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-lg border ${
                          a.isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
                            : 'bg-slate-500/10 text-slate-400 border-white/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {a.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">{fmtDate(a.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={!canManage || busy}
                            onClick={() => { setResetTarget(a); setResetPassword(generatePassword()); setShowResetPassword(false); setCopied(false); }}
                            title="Reset password"
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canManage || isSelf || busy}
                            onClick={() => updateStatus(a, !a.isActive)}
                            title={a.isActive ? 'Deactivate account' : 'Activate account'}
                            className={`p-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                              a.isActive ? 'text-slate-400 hover:text-rose-300 hover:border-rose-400/30' : 'text-slate-400 hover:text-emerald-300 hover:border-emerald-400/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal (reused from HR) */}
      {showCreateModal && (
        <HRCreateUserModal
          allowSuperAdmin={isSuper}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            setShowCreateModal(false);
            fetchAccounts();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setResetTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-400/30 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setResetTarget(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30">
                <KeyRound className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Reset Password</h3>
                <p className="text-[10px] text-slate-500 font-semibold">{resetTarget.name} · {resetTarget.email}</p>
              </div>
            </div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
            <div className="flex items-center gap-2 mb-4">
              <input
                type={showResetPassword ? 'text' : 'password'}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword((v) => !v)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                {showResetPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={copyResetPassword}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                title="Copy password"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mb-5">
              Password ko copy karke user ko do — dobara nahi dikhegi.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === resetTarget.id || resetPassword.length < 8}
                onClick={doPasswordReset}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-black disabled:opacity-40 hover:brightness-110 transition-all cursor-pointer"
              >
                {busyId === resetTarget.id ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
