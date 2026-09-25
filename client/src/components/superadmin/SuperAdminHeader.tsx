import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types/auth';
import { NotificationBell } from '../notifications/NotificationBell';
import { Menu, LogOut, Crown, ChevronDown, Settings } from 'lucide-react';

interface SuperAdminHeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  user,
  onLogout,
  onOpenMobileMenu,
  currentRoute,
  onNavigate,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (currentRoute === '/admin/dashboard' || currentRoute === '/' || !currentRoute) return 'Super Admin Dashboard';
    if (currentRoute.includes('/users')) return 'Users & Roles';
    if (currentRoute.includes('/employees')) return 'Employees';
    if (currentRoute.includes('/sales')) return 'Sales & Commissions';
    if (currentRoute.includes('/my-attendance')) return 'My Shift';
    if (currentRoute.includes('/attendance')) return 'Attendance';
    if (currentRoute.includes('/leaves')) return 'Leaves';
    if (currentRoute.includes('/tickets')) return 'Tickets';
    if (currentRoute.includes('/reports')) return 'Reports';
    if (currentRoute.includes('/settings')) return 'Settings';
    return 'Super Admin Dashboard';
  };

  return (
    <header
      className="h-14 shrink-0 mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4 px-3 sm:px-5 rounded-2xl bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.4)] flex items-center justify-between z-20"
    >
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] focus:outline-none cursor-pointer"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight truncate">{getPageTitle()}</h1>
      </div>

      {/* Right: notifications + user + logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell onNavigate={onNavigate} />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0C0C13]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-1.5 z-50 animate-scaleUp">
              <div className="p-2.5 border-b border-white/[0.06] mb-1">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Super Admin</span>
                </div>
                <div className="text-xs font-bold text-white mt-1">{user.name}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{user.email}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNavigate('/admin/settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Settings</span>
              </button>

              <div className="my-1 border-t border-white/[0.06]" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-400/10 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
