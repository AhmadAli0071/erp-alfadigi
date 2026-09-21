import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarCheck,
  Clock,
  CalendarDays,
  Ticket,
  BarChart3,
  Settings,
  ChevronLeft,
  X,
  Crown,
} from 'lucide-react';

interface SuperAdminSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingLeavesCount: number;
  openTicketsCount: number;
  superAdminsCount: number;
}

const NAV_ITEMS: { route: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { route: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: '/admin/users', label: 'Users & Roles', icon: Users },
  { route: '/admin/employees', label: 'Employees', icon: ShieldCheck },
  { route: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { route: '/admin/my-attendance', label: 'My Shift', icon: Clock },
  { route: '/admin/leaves', label: 'Leaves', icon: CalendarDays },
  { route: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { route: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { route: '/admin/settings', label: 'Settings', icon: Settings },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  pendingLeavesCount,
  openTicketsCount,
  superAdminsCount,
}) => {
  const badgeFor = (route: string): number | null => {
    if (route === '/admin/leaves') return pendingLeavesCount || null;
    if (route === '/admin/tickets') return openTicketsCount || null;
    if (route === '/admin/users') return superAdminsCount || null;
    return null;
  };

  const content = (
    <>
      {/* Brand + Super Admin Identity */}
      <div className={`relative px-4 pt-5 pb-4 border-b border-white/10 ${isCollapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/40">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 border-2 border-slate-950 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-black tracking-tight text-white leading-tight">Alfa Digi ERP</div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-400/30">
                <Crown className="w-2.5 h-2.5 text-rose-300" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Super Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto custom-scrollbar py-3 ${isCollapsed ? 'px-2' : 'px-3'} space-y-1`}>
        {!isCollapsed && (
          <div className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
            Full System Control
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
          const badge = badgeFor(item.route);
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer group relative
                ${active
                  ? 'bg-gradient-to-r from-rose-500/20 to-red-500/10 text-rose-200 ring-1 ring-rose-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-rose-400" />}
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rose-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {badge !== null && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && badge !== null && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer identity */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-rose-500/10 border border-rose-400/20">
            <ShieldCheck className="w-4 h-4 text-rose-300 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black text-rose-200 leading-tight">ROOT ACCESS</div>
              <div className="text-[9px] text-slate-500 leading-tight">All departments · All data</div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`hidden lg:flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        {!isCollapsed && 'Collapse'}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-full bg-slate-950 border-r border-white/10 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-slate-950 border-r border-white/10 flex flex-col transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          {content}
        </aside>
      </div>
    </>
  );
};
