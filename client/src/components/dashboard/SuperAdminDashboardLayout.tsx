import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { EmployeeAttendanceView } from '../employee/EmployeeAttendanceView';
import { SuperAdminSidebar } from '../superadmin/SuperAdminSidebar';
import { SuperAdminHeader } from '../superadmin/SuperAdminHeader';
import { SuperAdminUsersView } from '../superadmin/SuperAdminUsersView';
import { SuperAdminDashboardView } from './SuperAdminDashboardView';
import { HRAttendanceManagementView } from '../hr/HRAttendanceManagementView';
import { HRLeaveManagementView } from '../leave/HRLeaveManagementView';
import { HRTicketManagementView } from '../tickets/HRTicketManagementView';
import { HRReportsView } from '../reports/HRReportsView';
import { HRSettingsView } from '../settings/HRSettingsView';
import { HREmployeesManagementView } from '../employees/HREmployeesManagementView';

interface SuperAdminDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const SuperAdminDashboardLayout: React.FC<SuperAdminDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/admin/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [superAdminsCount, setSuperAdminsCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [leavesRes, ticketsRes, accRes] = await Promise.all([
        fetch('/api/leaves/hr-count', { headers }),
        fetch('/api/tickets/hr-count', { headers }),
        fetch('/api/auth/accounts', { headers }),
      ]);
      if (leavesRes.ok) setPendingLeavesCount((await leavesRes.json()).count || 0);
      if (ticketsRes.ok) setOpenTicketsCount((await ticketsRes.json()).count || 0);
      if (accRes.ok) {
        const accounts: { role: string }[] = (await accRes.json()).accounts || [];
        setSuperAdminsCount(accounts.filter((a) => a.role === 'SUPER_ADMIN').length);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCounts();
  }, [currentRoute]);

  useRealtimeRefresh(fetchCounts);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    setIsMobileMenuOpen(false);
  };

  const isMainDashboardRoute = currentRoute === '/admin/dashboard' || currentRoute === '/';
  const isUsersRoute = currentRoute.startsWith('/admin/users');
  const isEmployeesRoute = currentRoute.startsWith('/admin/employees');
  const isAttendanceRoute = currentRoute.startsWith('/admin/attendance');
  const isMyAttendanceRoute = currentRoute.startsWith('/admin/my-attendance');
  const isLeaveRoute = currentRoute.startsWith('/admin/leaves');
  const isTicketRoute = currentRoute.startsWith('/admin/tickets');
  const isReportRoute = currentRoute.startsWith('/admin/reports');
  const isSettingsRoute = currentRoute.startsWith('/admin/settings');

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* Distinct dark + rose ambient glow (Super Admin identity) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-red-700/10 blur-3xl" />
      </div>

      <SuperAdminSidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingLeavesCount={pendingLeavesCount}
        openTicketsCount={openTicketsCount}
        superAdminsCount={superAdminsCount}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-[1]">
        <SuperAdminHeader
          user={user}
          onLogout={onLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar" id="super-admin-content-area">
          {isMainDashboardRoute ? (
            <SuperAdminDashboardView user={user} onNavigate={handleNavigate} />
          ) : isUsersRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <SuperAdminUsersView user={user} onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} />
            </div>
          ) : isEmployeesRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HREmployeesManagementView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} />
            </div>
          ) : isAttendanceRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRAttendanceManagementView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} initialPreset="today" />
            </div>
          ) : isMyAttendanceRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <EmployeeAttendanceView user={user} onNavigate={handleNavigate} backRoute="/admin/dashboard" />
            </div>
          ) : isLeaveRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRLeaveManagementView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} initialPreset="this_month" />
            </div>
          ) : isTicketRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRTicketManagementView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} />
            </div>
          ) : isReportRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRReportsView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} />
            </div>
          ) : isSettingsRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRSettingsView onNavigateToDashboard={() => handleNavigate('/admin/dashboard')} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};
