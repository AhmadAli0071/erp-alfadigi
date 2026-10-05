import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  ShieldCheck,
  CalendarCheck,
  Clock,
  CalendarDays,
  Ticket,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Crown,
  BadgeDollarSign,
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

const NAV_ITEMS: { route: string; label: string; icon: React.FC<{ className?: string }>; badgeColor?: string }[] = [
  { route: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { route: '/admin/users', label: 'Users & Roles', icon: Users },
  { route: '/admin/employees', label: 'Employees', icon: ShieldCheck },
  { route: '/admin/sales', label: 'Sales & Commission', icon: BadgeDollarSign },
  { route: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { route: '/admin/my-attendance', label: 'My Shift', icon: Clock },
  { route: '/admin/leaves', label: 'Leaves', icon: CalendarDays, badgeColor: 'bg-amber-400/10 text-amber-300 border border-amber-400/20' },
  { route: '/admin/tickets', label: 'Tickets', icon: Ticket, badgeColor: 'bg-violet-400/10 text-violet-300 border border-violet-400/20' },
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

  const isRouteActive = (route: string) =>
    currentRoute === route || currentRoute.startsWith(route + '/');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A0A0F]/95 backdrop-blur-xl border-r border-white/[0.06] text-slate-400 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/admin/dashboard')}>
            <BrandLogo size="sm" />
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center cursor-pointer"
            onClick={() => onNavigate('/admin/dashboard')}
            title="Alfa Digi ERP"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-amber-500/25">
              A
            </div>
          </div>
        )}

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] focus:outline-none cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar" aria-label="Sidebar Navigation">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            Full System Control
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.route);
          const badge = badgeFor(item.route);
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              title={isCollapsed ? item.label : undefined}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                active
                  ? 'bg-amber-400/[0.08] text-amber-300 border border-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.06)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`transition-colors ${active ? 'text-amber-300' : 'text-slate-600 group-hover:text-slate-300'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-amber-300 to-yellow-500" />
                )}
              </div>

              {!isCollapsed && badge !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'}`}>
                  {badge}
                </span>
              )}
              {isCollapsed && badge !== null && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Compact Portal Tag */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-white/[0.03] border border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
              <Crown className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-200/90 leading-tight">Super Admin Portal</div>
              <div className="text-[9px] text-slate-500 leading-tight">All departments · All data</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
