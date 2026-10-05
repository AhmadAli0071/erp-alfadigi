import React, { useState } from 'react';
import { User } from '../../types/auth';
import { HODDashboardView } from './HODDashboardView';
import { AnnouncementsView } from '../common/AnnouncementsView';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { BrandLogo } from '../common/BrandLogo';
import { Crown, LayoutDashboard, LogOut, ShieldCheck, Sparkles, UserCircle, Megaphone } from 'lucide-react';

interface HodDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const HodDashboardLayout: React.FC<HodDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/hod/dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(user.mustChangePassword === true);

  const navItems = [
    { route: '/hod/dashboard', label: 'Company Pulse', icon: LayoutDashboard },
    { route: '/hod/announcements', label: 'Announcements', icon: Megaphone },
    { route: '/hod/profile', label: 'My Profile', icon: UserCircle },
  ];

  const activeRoute = currentRoute.startsWith('/hod/profile')
    ? '/hod/profile'
    : currentRoute.startsWith('/hod/announcements')
      ? '/hod/announcements'
      : '/hod/dashboard';

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-slate-800 overflow-hidden font-sans relative">
      <div className="app-bg" aria-hidden="true" />

      {/* Sidebar - premium dark with gold accents */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border-r border-white/5 flex flex-col">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <BrandLogo size="sm" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-200/10 border border-amber-400/30">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-300">HOD Command</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = activeRoute === item.route;
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => {
                    setCurrentRoute(item.route);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-amber-400/20 to-transparent text-amber-200 border border-amber-400/25 shadow-lg shadow-amber-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User chip */}
          <div className="px-3 pb-4">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-extrabold ring-2 ring-amber-400/40 shrink-0">
                  {user.name.split(' ').map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-amber-200/70 font-semibold truncate">{user.jobTitle}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-[11px] font-bold hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/60 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <h1 className="text-sm font-extrabold text-slate-900 truncate">
                    {activeRoute === '/hod/profile' ? 'My Profile' : 'HOD Command Center'}
                  </h1>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">Alfa Digi Corp · All Departments Overview</p>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/15 to-amber-100/10 border border-amber-300/40 text-amber-700 text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Premium Access
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeRoute === '/hod/profile' ? (
            <div className="p-8 max-w-2xl mx-auto">              <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-200/70">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-extrabold ring-2 ring-amber-400/40">
                    {user.name.split(' ').map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{user.jobTitle} · {user.department}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">Head of Departments</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">All Departments · Read</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeRoute === '/hod/announcements' ? (
            <AnnouncementsView title="Announcement Board" subtitle="Company-wide updates from HR" />
          ) : (
            <HODDashboardView user={user} />
          )}
        </main>
      </div>

      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
