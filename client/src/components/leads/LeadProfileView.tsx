import React, { useEffect, useState } from 'react';
import { User } from '../../types/auth';
import { ChangePasswordCard } from '../common/ChangePasswordCard';

interface LeadProfileViewProps {
  user: User;
}

export const LeadProfileView: React.FC<LeadProfileViewProps> = ({ user }) => {
  const [loadedAt] = useState(() => new Date());
  const [account, setAccount] = useState<{ name: string; email: string; role: string; department?: string; jobTitle?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token') || '';
    let cancelled = false;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) setAccount(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const name = account?.name || user.name;
  const email = account?.email || user.email;
  const role = account?.role || user.role;
  const jobTitle = account?.jobTitle || (user as { jobTitle?: string }).jobTitle || '';
  const department = account?.department || (user as { department?: string }).department || '';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const infoChips = [
    { label: 'Email', value: email },
    { label: 'Role', value: role.replace(/_/g, ' ') },
    ...(jobTitle ? [{ label: 'Job Title', value: jobTitle }] : []),
    ...(department ? [{ label: 'Department', value: department }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Profile</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Your account details and security settings
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-lg font-extrabold shadow-lg shadow-indigo-500/25 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900 truncate">{name}</div>
            <div className="text-xs text-slate-500 font-semibold truncate">{email}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
          {infoChips.map((chip) => (
            <div key={chip.label} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{chip.label}</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5 truncate capitalize">{chip.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security: Change Password */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          <h3 className="text-sm font-extrabold text-slate-900">Security</h3>
        </div>
        <ChangePasswordCard />
      </div>

      <p className="text-[11px] text-slate-400 font-medium">
        Signed in on {loadedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
};
