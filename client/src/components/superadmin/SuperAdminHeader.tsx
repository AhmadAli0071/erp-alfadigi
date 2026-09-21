import React from 'react';
import { User } from '../../types/auth';
import { NotificationBell } from '../notifications/NotificationBell';
import { Menu, LogOut, Crown } from 'lucide-react';

interface SuperAdminHeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  user,
  onLogout,
  onOpenMobileMenu,
}) => {
  return (
    <header className="shrink-0 h-16 bg-slate-950/95 backdrop-blur border-b border-white/10 flex items-center justify-between gap-3 px-4 sm:px-6 z-10">
      {/* Left: mobile menu + identity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/30">
          <Crown className="w-3.5 h-3.5 text-rose-300" />
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Super Admin Session</span>
        </div>
      </div>

      {/* Right: notifications + user + logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell onNavigate={() => {}} viewAllRoute="/admin/dashboard" />
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-black text-xs ring-2 ring-rose-400/30 shrink-0">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-xs font-black text-white truncate leading-tight">{user.name}</div>
            <div className="text-[10px] font-bold text-rose-300/80 leading-tight">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
