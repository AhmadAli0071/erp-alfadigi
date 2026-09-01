import React, { useState } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { LeadSidebar } from './LeadSidebar';
import { LeadHeader } from './LeadHeader';
import { SalesDashboardView } from '../sales/SalesDashboardView';
import { TechDashboardView } from '../tech/TechDashboardView';

interface LeadDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const LeadDashboardLayout: React.FC<LeadDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/lead/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const department = (user.department || 'Tech') as LeadDepartment;

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const isDashboardRoute = currentRoute === '/lead/dashboard' || currentRoute === '/' || !currentRoute;

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-slate-800 overflow-hidden font-sans relative">
      <div className="app-bg" aria-hidden="true" />

      <LeadSidebar
        department={department}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingCount={0}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-[1]">
        <LeadHeader
          user={user}
          department={department}
          onLogout={onLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar" id="lead-dashboard-content-area">
          {isDashboardRoute ? (
            department === 'Sales' ? (
              <SalesDashboardView user={user} onNavigate={handleNavigate} />
            ) : (
              <TechDashboardView user={user} onNavigate={handleNavigate} />
            )
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fadeIn">
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
                <p className="text-sm font-semibold text-slate-500">
                  {currentRoute.split('/').pop()?.replace(/-/g, ' ')} — Coming soon
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
