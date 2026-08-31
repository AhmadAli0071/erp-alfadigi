import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Ticket,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface HRSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingLeavesCount?: number;
  openTicketsCount?: number;
}

export const HRSidebar: React.FC<HRSidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  pendingLeavesCount = 0,
  openTicketsCount = 0,
}) => {
  // Simple, clean primary navigation as requested
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      route: '/hr/dashboard',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: <Users className="w-4 h-4 shrink-0" />,
      route: '/hr/employees',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      route: '/hr/attendance',
    },
    {
      id: 'leaves',
      label: 'Leaves',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
      route: '/hr/leaves',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: <Ticket className="w-4 h-4 shrink-0" />,
      route: '/hr/tickets',
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      route: '/hr/reports',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      route: '/hr/settings',
    },
  ];

  const handleItemClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  const isRouteActive = (route: string) => {
    if (route === '/hr/dashboard') {
      return currentRoute === '/hr/dashboard' || currentRoute === '/' || !currentRoute;
    }
    return currentRoute.startsWith(route);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d0e12] border-r border-white/5 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        {!isCollapsed ? (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleItemClick('/hr/dashboard')}
          >
            <BrandLogo size="sm" />
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center cursor-pointer"
            onClick={() => handleItemClick('/hr/dashboard')}
            title="Alfa Digi ERP"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/30">
              A
            </div>
          </div>
        )}

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors focus:outline-none cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar"
        aria-label="Sidebar Navigation"
        id="hr-sidebar-nav"
      >
        {navItems.map((item) => {
          const active = isRouteActive(item.route);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.route)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                active
                  ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
              id={`sidebar-nav-${item.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`transition-colors ${
                    active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-white/10 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Compact Portal Tag */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl bg-white/[0.02] border border-white/5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">HR Admin Portal</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v2.4</span>
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
        id="hr-desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
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
