import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowLeft, Clock, CalendarDays, Ticket, Users, BarChart3, Settings } from 'lucide-react';
import { HRAttendanceTable } from './HRAttendanceTable';
import { hrDashboardService } from '../../services/hrDashboardService';
import { AttendanceRecord } from '../../types/hr';
import { HREmployeeDetailModal } from './HREmployeeDetailModal';

interface HRPlaceholderViewProps {
  route: string;
  onNavigateToDashboard: () => void;
}

export const HRPlaceholderView: React.FC<HRPlaceholderViewProps> = ({
  route,
  onNavigateToDashboard,
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (route.includes('/attendance')) {
      hrDashboardService.getTodayAttendance().then(setAttendanceRecords);
    }
  }, [route]);

  // If route is /hr/attendance/today or /hr/attendance, show the dedicated Attendance page
  if (route === '/hr/attendance/today' || route === '/hr/attendance') {
    return (
      <div className="space-y-6 animate-fadeIn" id="dedicated-attendance-page">
        {/* Back navigation header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="p-2 rounded-xl bg-slate-100/50 hover:bg-slate-100/70 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to HR Dashboard</span>
            </button>
            <div className="h-4 w-px bg-slate-200/50" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today's Attendance Records</h2>
              <p className="text-xs text-slate-500">Detailed shift logs, overnight punches, and department filters</p>
            </div>
          </div>
        </div>

        {/* Detailed Attendance Table on its dedicated page */}
        <HRAttendanceTable
          records={attendanceRecords}
          initialDepartmentFilter="ALL"
          initialStatusFilter="ALL"
          onViewDetails={(rec) => setSelectedRecord(rec)}
          onNavigate={(r) => {}}
        />

        {selectedRecord && (
          <HREmployeeDetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </div>
    );
  }

  const getSectionDetails = () => {
    if (route.includes('/employees')) {
      return {
        title: 'Employee Directory',
        subtitle: 'Manage staff profiles, department assignments, and onboarding records.',
        tag: 'HR Management',
        icon: <Users className="w-6 h-6 text-indigo-600" />,
      };
    }
    if (route.includes('/leaves')) {
      return {
        title: 'Leave Management',
        subtitle: 'Review leave applications, manage quotas, and track annual leave balances.',
        tag: 'Leave Policies',
        icon: <CalendarDays className="w-6 h-6 text-blue-600" />,
      };
    }
    if (route.includes('/tickets')) {
      return {
        title: 'Helpdesk & Support Tickets',
        subtitle: 'Manage employee inquiries, HR complaints, and support ticket queues.',
        tag: 'Helpdesk',
        icon: <Ticket className="w-6 h-6 text-purple-600" />,
      };
    }
    if (route.includes('/reports')) {
      return {
        title: 'Reports & Analytics',
        subtitle: 'Generate monthly attendance reports, overtime logs, and payroll exports.',
        tag: 'Analytics',
        icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      };
    }
    if (route.includes('/settings')) {
      return {
        title: 'System Settings',
        subtitle: 'Configure company shifts, holiday calendars, and role permissions.',
        tag: 'Configuration',
        icon: <Settings className="w-6 h-6 text-slate-500" />,
      };
    }
    return {
      title: 'Dedicated Module',
      subtitle: 'This section is accessed from the HR Dashboard.',
      tag: 'Alfa Digi ERP',
      icon: <Clock className="w-6 h-6 text-indigo-600" />,
    };
  };

  const details = getSectionDetails();

  return (
    <div className="p-8 sm:p-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 text-center max-w-2xl mx-auto shadow-xl my-8 space-y-6 animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-slate-100/50 border border-slate-200/80 flex items-center justify-center mx-auto shadow-inner">
        {details.icon}
      </div>

      <div className="space-y-2">
        <span className="inline-block text-[10px] font-mono font-bold px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase tracking-wider">
          {details.tag}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {details.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {details.subtitle}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left text-xs text-slate-500 max-w-md mx-auto space-y-1 font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Route:</span>
          <span className="text-indigo-600 font-semibold">{route}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Status:</span>
          <span className="text-slate-600">Dedicated Module View</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          id="placeholder-back-to-dashboard-btn"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to HR Dashboard</span>
        </button>
      </div>
    </div>
  );
};
