import React, { useState } from 'react';
import { User } from '../../types/auth';
import { HRSidebar } from '../hr/HRSidebar';
import { HRHeader } from '../hr/HRHeader';
import { HRDashboardView } from './HRDashboardView';
import { HRAttendanceManagementView } from '../hr/HRAttendanceManagementView';
import { HRLeaveManagementView } from '../leave/HRLeaveManagementView';
import { HRTicketManagementView } from '../tickets/HRTicketManagementView';
import { HRReportsView } from '../reports/HRReportsView';
import { HRSettingsView } from '../settings/HRSettingsView';
import { HREmployeesManagementView } from '../employees/HREmployeesManagementView';
import { HRPlaceholderView } from '../hr/HRPlaceholderView';

interface HRDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const HRDashboardLayout: React.FC<HRDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/hr/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const isMainDashboardRoute =
    currentRoute === '/hr/dashboard' || currentRoute === '/' || !currentRoute;

  const isAttendanceRoute = currentRoute.startsWith('/hr/attendance');
  const isLeaveRoute = currentRoute.startsWith('/hr/leaves');
  const isTicketRoute = currentRoute.startsWith('/hr/tickets');
  const isReportRoute = currentRoute.startsWith('/hr/reports');
  const isSettingsRoute = currentRoute.startsWith('/hr/settings');
  const isEmployeesRoute = currentRoute.startsWith('/hr/employees');

  const getAttendancePreset = () => {
    if (currentRoute === '/hr/attendance/today') return 'today';
    if (currentRoute === '/hr/attendance/history') return 'last_7_days';
    return 'today';
  };

  const getLeavePreset = () => {
    if (currentRoute === '/hr/leaves/today') return 'today';
    if (currentRoute === '/hr/leaves/history') return 'this_year';
    return 'this_month';
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-slate-800 overflow-hidden font-sans relative">
      {/* Subtle decorative background glow */}
      <div className="app-bg" aria-hidden="true" />

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <HRSidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingLeavesCount={0}
        openTicketsCount={0}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-[1]">
        {/* Top Header */}
        <HRHeader
          user={user}
          onLogout={onLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />

        {/* Scrollable View Content */}
        <main
          className="flex-1 overflow-y-auto custom-scrollbar"
          id="hr-dashboard-content-area"
        >
          {isMainDashboardRoute ? (
            <HRDashboardView user={user} onNavigate={handleNavigate} />
          ) : isEmployeesRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HREmployeesManagementView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
              />
            </div>
          ) : isAttendanceRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRAttendanceManagementView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
                initialPreset={getAttendancePreset()}
              />
            </div>
          ) : isLeaveRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRLeaveManagementView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
                initialPreset={getLeavePreset()}
              />
            </div>
          ) : isTicketRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRTicketManagementView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
              />
            </div>
          ) : isReportRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRReportsView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
              />
            </div>
          ) : isSettingsRoute ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRSettingsView
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <HRPlaceholderView
                route={currentRoute}
                onNavigateToDashboard={() => handleNavigate('/hr/dashboard')}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

