import { UserRole } from './auth';

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'Leave'
  | 'Work From Home'
  | 'On Duty'
  | 'Holiday'
  | 'Weekend'
  | 'Pending OT'
  | 'Short Hours';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Closed';

export type LeaveTypeCategory = 'Casual Leave' | 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type DepartmentName = 'HR' | 'Sales' | 'Tech';

export interface Employee {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: DepartmentName;
  jobTitle: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  reportedTo?: {
    id: string;
    name: string;
    empId: string;
    jobTitle: string;
  } | null;
}

export interface AttendanceTimelineEvent {
  id: string;
  time: string;
  date: string;
  type: 'CLOCK_IN' | 'PAUSE' | 'RESUME' | 'CLOCK_OUT' | 'SYSTEM_FLAG';
  label: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation?: string;
  avatar?: string;
  department: DepartmentName;
  attendanceDate: string; // e.g. "31 Aug 2026"
  clockInTime: string; // e.g. "05:55 PM"
  clockInDate: string; // e.g. "31 Aug"
  clockOutTime: string; // e.g. "03:05 AM"
  clockOutDate: string; // e.g. "01 Sep"
  breakDuration: string; // e.g. "01:00"
  workingHours: string; // e.g. "08:10"
  extraHours: string; // e.g. "00:10"
  shortHours: string; // e.g. "00:00"
  status: AttendanceStatus;
  notes?: string;
  remarks?: string;
  isOvernight: boolean;
  timeline?: AttendanceTimelineEvent[];
}

export interface EmployeeAttendanceSummary {
  employee: Employee;
  periodLabel: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  wfhDays: number;
  halfDays: number;
  avgWorkingHours: string;
  totalShortHours: string;
  approvedExtraHours: string;
  pendingExtraHours: string;
}

export interface CompanyAttendanceSummary {
  periodLabel: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  wfhCount: number;
  halfDayCount: number;
  avgWorkingHours: string;
  totalShortHours: string;
  totalApprovedExtraHours: string;
  attendanceRate: number;
}

export interface PendingActionItem {
  id: string;
  type: 'LEAVE_REQUEST' | 'ATTENDANCE_CORRECTION' | 'EXTRA_HOURS';
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: DepartmentName;
  requestType: string; // e.g. "Casual Leave", "Missing Clock In", "Extra Hours (Overtime)"
  details: string; // e.g. "2 Days (Aug 31 - Sep 01)", "Forgot to punch in at 6:00 PM", "20 min post-shift extra work"
  date: string;
  status: RequestStatus;
  submissionTime: string;
  extraTimeAmount?: string;
  appliedByLead?: string;
}

export interface LeaveOverviewCategory {
  type: LeaveTypeCategory;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  colorClass: string;
}

export interface DepartmentSummaryItem {
  department: DepartmentName;
  totalEmployees: number;
  present: number;
  absent: number;
  onLeave: number;
  wfh: number;
  attendanceRate: number; // percentage e.g. 83
}

export interface AttendanceTrendPoint {
  date: string;
  dayShort: string;
  present: number;
  absent: number;
  leave: number;
  isWeekend: boolean;
  totalShiftEmployees: number;
}

export interface HRActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'LEAVE' | 'ATTENDANCE' | 'SYSTEM' | 'EMPLOYEE' | 'TICKET';
  actorName: string;
  actorRole: string;
}

export interface HRNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'CORRECTION' | 'LEAVE' | 'OVERTIME' | 'TICKET' | 'INFO';
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export interface HRDashboardKPIs {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  lateOrShortHoursToday: number;
  halfDayToday: number;
  workFromHomeToday: number;
  pendingRequestsCount: number;
  openTicketsCount: number;
  pendingTicketsCount: number;
  pendingLeavesCount: number;
  pendingCorrectionsCount: number;
  pendingOvertimeCount: number;
  pendingExtraHoursTotalTime: string;
  pendingExtraHoursEmployeesCount: number;
}

export interface GlobalSearchResult {
  id: string;
  category: 'Employees' | 'Attendance' | 'Tickets' | 'Leave Requests';
  title: string;
  subtitle: string;
  badge?: string;
  linkRoute?: string;
}
