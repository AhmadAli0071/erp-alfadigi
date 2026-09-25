import React, { useEffect, useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { notificationService } from '../../services/notificationService';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Ticket,
  Bell,
  Wallet,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface EmployeeSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.refreshUnreadCount();
    const unsub = notificationService.onUnreadCount((count) => setUnreadCount(count));
    return () => unsub();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, route: '/employee/dashboard' },
    { id: 'attendance', label: 'Attendance', icon: <Clock className="w-4 h-4 shrink-0" />, route: '/employee/attendance' },
    { id: 'leaves', label: 'Leaves', icon: <CalendarDays className="w-4 h-4 shrink-0" />, route: '/employee/leaves' },
    { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-4 h-4 shrink-0" />, route: '/employee/tickets' },
{ id: 'earnings', label: 'Salary & Earnings', icon: <Wallet className="w-4 h-4 shrink-0" />, route: '/employee/earnings' },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 shrink-0" />, route: '/employee/notifications', badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4 shrink-0" />, route: '/employee/profile' },
  ];

  const handleItemClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  const isRouteActive = (route: string) => {
    if (route === '/employee/dashboard') {
      return currentRoute === '/employee/dashboard' || currentRoute === '/' || !currentRoute;
    }
    return currentRoute.startsWith(route);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/75 backdrop-blur-xl border-r border-slate-200/70 text-slate-600 select-none">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/70 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleItemClick('/employee/dashboard')}>
            <BrandLogo size="sm" />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center cursor-pointer" onClick={() => handleItemClick('/employee/dashboard')} title="Alfa Digi ERP">
            <img src="/alfa-logo.png" alt="Alfa Digi" className="w-12 h-12 object-contain" draggable={false} />
          </div>
        )}

        <button type="button" onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 focus:outline-none cursor-pointer" aria-label="Close sidebar">
          <X className="w-5 h-5" />
        </button>

        <button type="button" onClick={onToggleCollapse} className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors focus:outline-none cursor-pointer" title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar" aria-label="Employee Sidebar Navigation" id="employee-sidebar-nav">
        {navItems.map((item) => {
          const active = isRouteActive(item.route);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.route)}
              title={isCollapsed ? item.label : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                active
                  ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border border-transparent'
              }`}
              id={`sidebar-nav-${item.id}`}
            >
              <span className={`transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && 'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {isCollapsed && 'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500/80" />
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600">Employee Portal</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v2.4</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:block shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${isCollapsed ? 'w-20' : 'w-60'}`} id="employee-desktop-sidebar">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity" onClick={onCloseMobile} aria-hidden="true" />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
