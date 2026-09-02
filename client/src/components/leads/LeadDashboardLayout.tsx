import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { LeadSidebar } from './LeadSidebar';
import { LeadHeader } from './LeadHeader';
import { LeadDashboardHomeView } from './LeadDashboardHomeView';
import { LeadAttendanceView } from './LeadAttendanceView';
import { LeadLeaveView } from './LeadLeaveView';
import { LeadTicketsView } from './LeadTicketsView';
import { LeadTeamView } from './LeadTeamView';

interface LeadDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const LeadDashboardLayout: React.FC<LeadDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/lead/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const department = (user.department || 'Tech') as LeadDepartment;

  // Real pending leave count for sidebar badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/leaves/pending-count/${user.email}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count || 0);
        }
      } catch { /* ignore */ }
    };
    fetchPending();
  }, [user.email, currentRoute]);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const isDashboardRoute = currentRoute === '/lead/dashboard' || currentRoute === '/' || !currentRoute;
  const isTeamRoute = currentRoute.startsWith('/lead/team');
  const isAttendanceRoute = currentRoute.startsWith('/lead/attendance');
  const isLeaveRoute = currentRoute.startsWith('/lead/leave');
  const isTicketsRoute = currentRoute.startsWith('/lead/tickets');

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
        pendingCount={pendingCount}
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
            <LeadDashboardHomeView user={user} department={department} onNavigate={handleNavigate} />
          ) : isTeamRoute ? (
            <LeadTeamView user={user} department={department} onNavigate={handleNavigate} />
          ) : isAttendanceRoute ? (
            <LeadAttendanceView user={user} department={department} onNavigate={handleNavigate} />
          ) : isLeaveRoute ? (
            <LeadLeaveView user={user} department={department} onNavigate={handleNavigate} />
          ) : isTicketsRoute ? (
            <LeadTicketsView user={user} department={department} onNavigate={handleNavigate} />
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
