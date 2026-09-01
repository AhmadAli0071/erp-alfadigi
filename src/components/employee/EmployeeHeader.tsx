import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types/auth';
import { Menu, Bell, ChevronDown, Settings, LogOut } from 'lucide-react';

interface EmployeeHeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  user,
  onLogout,
  onOpenMobileMenu,
  currentRoute,
  onNavigate,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitle = currentRoute.split('/').pop() || 'dashboard';
  const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0" id="employee-header">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenMobileMenu} className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{capitalizedTitle}</h1>
          <p className="text-[11px] text-slate-500 font-medium">Employee Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/employee/notifications')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors relative focus:outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer"
            id="employee-profile-btn"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">{user.jobTitle}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl py-2 z-50 animate-scaleUp">
              <div className="px-4 py-3 border-b border-slate-200/70">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={() => { onNavigate('/employee/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Profile</span>
              </button>
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
