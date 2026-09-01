import React, { useState } from 'react';
import { User } from '../../types/auth';
import { EmployeeSidebar } from './EmployeeSidebar';
import { EmployeeHeader } from './EmployeeHeader';
import { EmployeeDashboardView } from './EmployeeDashboardView';
import { EmployeeAttendanceView } from './EmployeeAttendanceView';
import { EmployeeLeaveView } from './EmployeeLeaveView';
import { EmployeeTicketsView } from './EmployeeTicketsView';
import { EmployeeNotificationsView } from './EmployeeNotificationsView';
import { EmployeeProfileView } from './EmployeeProfileView';

interface EmployeeDashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export const EmployeeDashboardLayout: React.FC<EmployeeDashboardLayoutProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('/employee/dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const isDashboardRoute = currentRoute === '/employee/dashboard' || currentRoute === '/' || !currentRoute;
  const isAttendanceRoute = currentRoute.startsWith('/employee/attendance');
  const isLeaveRoute = currentRoute.startsWith('/employee/leaves');
  const isTicketsRoute = currentRoute.startsWith('/employee/tickets');
  const isNotificationsRoute = currentRoute.startsWith('/employee/notifications');
  const isProfileRoute = currentRoute.startsWith('/employee/profile');

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-slate-800 overflow-hidden font-sans relative">
      <div className="app-bg" aria-hidden="true" />

      <EmployeeSidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-[1]">
        <EmployeeHeader
          user={user}
          onLogout={onLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar" id="employee-dashboard-content-area">
          {isDashboardRoute ? (
            <EmployeeDashboardView user={user} onNavigate={handleNavigate} />
          ) : isAttendanceRoute ? (
            <EmployeeAttendanceView user={user} onNavigate={handleNavigate} />
          ) : isLeaveRoute ? (
            <EmployeeLeaveView user={user} onNavigate={handleNavigate} />
          ) : isTicketsRoute ? (
            <EmployeeTicketsView user={user} onNavigate={handleNavigate} />
          ) : isNotificationsRoute ? (
            <EmployeeNotificationsView user={user} onNavigate={handleNavigate} />
          ) : isProfileRoute ? (
            <EmployeeProfileView user={user} onNavigate={handleNavigate} />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fadeIn">
              <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
                <p className="text-sm font-semibold text-slate-500">Page not found</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
