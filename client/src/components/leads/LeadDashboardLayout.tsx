import React, { useState, useEffect } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { LeadSidebar } from './LeadSidebar';
import { LeadHeader } from './LeadHeader';
import { LeadDashboardHomeView } from './LeadDashboardHomeView';
import { LeadAttendanceView } from './LeadAttendanceView';
import { LeadLeaveView } from './LeadLeaveView';
import { LeadTicketsView } from './LeadTicketsView';
import { LeadTeamView } from './LeadTeamView';
import { LeadSaleView } from './LeadSaleView';
import { LeadProfileView } from './LeadProfileView';
import { SalaryEarningsView } from '../common/SalaryEarningsView';

interface LeadDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const LeadDashboardLayout: React.FC<LeadDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/lead/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  const department = (user.department || 'Tech') as LeadDepartment;

  // Real pending leave count + open team tickets count for sidebar badges
  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [leaveRes, ticketsRes] = await Promise.all([
        fetch(`/api/leaves/pending-count/${user.email}`, { headers }),
        fetch(`/api/tickets/team/${user.email}`, { headers }),
      ]);
      if (leaveRes.ok) {
        const data = await leaveRes.json();
        setPendingCount(data.count || 0);
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        const active = (data.tickets || []).filter((t: { status?: string }) => !['Closed', 'Rejected', 'Cancelled'].includes(t.status || '')).length;
        setOpenTicketsCount(active);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCounts();
  }, [user.email, currentRoute]);

  // Live refresh: SSE notification ya window focus par sidebar badge counts refetch
  useRealtimeRefresh(fetchCounts);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const isDashboardRoute = currentRoute === '/lead/dashboard' || currentRoute === '/' || !currentRoute;
  const isEarningsRoute = currentRoute.startsWith('/lead/earnings');
  const isSalesPageRoute = currentRoute.startsWith('/lead/sales');
  const isTeamRoute = currentRoute.startsWith('/lead/team');
  const isAttendanceRoute = currentRoute.startsWith('/lead/attendance');
  const isLeaveRoute = currentRoute.startsWith('/lead/leave');
  const isTicketsRoute = currentRoute.startsWith('/lead/tickets');
  const isProfileRoute = currentRoute.startsWith('/lead/profile');

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
        openTicketsCount={openTicketsCount}
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
          ) : isEarningsRoute ? (
            <SalaryEarningsView onNavigateToDashboard={() => handleNavigate('/lead/dashboard')} />
          ) : isSalesPageRoute && department === 'Sales' ? (
            <LeadSaleView user={user} onNavigateToDashboard={() => handleNavigate('/lead/dashboard')} />
          ) : isTeamRoute ? (
            <LeadTeamView user={user} department={department} onNavigate={handleNavigate} />
          ) : isAttendanceRoute ? (
            <LeadAttendanceView user={user} department={department} onNavigate={handleNavigate} />
          ) : isLeaveRoute ? (
            <LeadLeaveView user={user} department={department} onNavigate={handleNavigate} />
          ) : isTicketsRoute ? (
            <LeadTicketsView user={user} department={department} onNavigate={handleNavigate} />
          ) : isProfileRoute ? (
            <LeadProfileView user={user} />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fadeIn">
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
                <p className="text-sm font-semibold text-slate-500">
                  {currentRoute.split('/').pop()?.replace(/-/g, ' ')}. Coming soon
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
