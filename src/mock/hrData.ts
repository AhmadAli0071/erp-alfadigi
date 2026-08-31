import {
  AttendanceRecord,
  AttendanceTrendPoint,
  DepartmentSummaryItem,
  Employee,
  HRActivityItem,
  HRDashboardKPIs,
  HRNotification,
  LeaveOverviewCategory,
  PendingActionItem,
} from '../types/hr';

export const MOCK_EMPLOYEES: Employee[] = [];

export const MOCK_TODAY_ATTENDANCE: AttendanceRecord[] = [];

export const MOCK_PENDING_ACTIONS: PendingActionItem[] = [];

export const MOCK_DASHBOARD_KPIS: HRDashboardKPIs = {
  totalEmployees: 0,
  presentToday: 0,
  absentToday: 0,
  onLeaveToday: 0,
  lateOrShortHoursToday: 0,
  halfDayToday: 0,
  workFromHomeToday: 0,
  pendingRequestsCount: 0,
  openTicketsCount: 0,
  pendingTicketsCount: 0,
  pendingLeavesCount: 0,
  pendingCorrectionsCount: 0,
  pendingOvertimeCount: 0,
  pendingExtraHoursTotalTime: '—',
  pendingExtraHoursEmployeesCount: 0,
};

export const MOCK_LEAVE_OVERVIEW: LeaveOverviewCategory[] = [];

export const MOCK_DEPARTMENT_SUMMARY: DepartmentSummaryItem[] = [];

export const MOCK_ATTENDANCE_TREND: AttendanceTrendPoint[] = [];

export const MOCK_RECENT_ACTIVITIES: HRActivityItem[] = [];

export const MOCK_NOTIFICATIONS: HRNotification[] = [];
