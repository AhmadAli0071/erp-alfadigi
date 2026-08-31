import { DepartmentName, Employee } from './hr';

export type LeaveTypeName =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Annual Leave'
  | 'Unpaid Leave'
  | 'Maternity / Paternity'
  | 'Bereavement Leave'
  | 'Special / Other Leave';

export type LeaveRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Withdrawn';

export interface LeaveApprovalStep {
  id: string;
  stepNumber: number;
  role: 'Employee' | 'Department Lead' | 'HR Admin' | 'Final Approval';
  actorName: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING' | 'SKIPPED';
  timestamp?: string; // e.g. "01 Sep 2026 — 09:20 PM"
  statusLabel: 'Completed' | 'Pending' | 'Rejected' | 'Waiting';
  notes?: string;
}

export interface LeaveRequest {
  id: string; // e.g. "LR-1024"
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: DepartmentName;
  designation: string;
  avatar?: string;
  leaveType: LeaveTypeName;
  startDate: string; // "YYYY-MM-DD" e.g. "2026-09-04"
  endDate: string; // "YYYY-MM-DD" e.g. "2026-09-05"
  startDateDisplay: string; // "04 Sep 2026"
  endDateDisplay: string; // "05 Sep 2026"
  totalDays: number; // e.g. 2
  submittedDate: string; // "01 Sep 2026"
  submittedTime: string; // "09:20 PM"
  reason: string;
  status: LeaveRequestStatus;
  leadApproverName?: string;
  leadApprovalDate?: string;
  hrApproverName?: string;
  hrApprovalDate?: string;
  rejectionReason?: string;
  timeline: LeaveApprovalStep[];
  attachmentName?: string;
  isEmergency?: boolean;
}

export interface LeaveCategoryBalance {
  leaveType: LeaveTypeName;
  allocated: number;
  available: number;
  used: number;
  pending: number;
  color: string;
}

export interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: DepartmentName;
  designation: string;
  year: number;
  categories: {
    casual: LeaveCategoryBalance;
    annual: LeaveCategoryBalance;
    sick: LeaveCategoryBalance;
    unpaid: LeaveCategoryBalance;
    other: LeaveCategoryBalance;
  };
}

export interface LeaveTypePolicy {
  id: string;
  name: LeaveTypeName;
  code: string;
  annualQuota: number;
  carryForwardLimit: number;
  isPaid: boolean;
  requiresLeadApproval: boolean;
  requiresDocument: boolean;
  description: string;
  colorBadge: string;
}

export interface LeaveSummaryStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  employeesOnLeaveToday: number;
  totalDaysApproved: number;
  distribution: {
    casual: number;
    annual: number;
    sick: number;
    unpaid: number;
    other: number;
  };
}

export interface LeaveFilterParams {
  searchQuery?: string;
  employeeId?: string; // 'ALL' or specific emp_id
  department?: string; // 'ALL' | 'HR' | 'Sales' | 'Tech'
  leaveType?: string; // 'ALL' | LeaveTypeName
  status?: string; // 'ALL' | LeaveRequestStatus
  datePreset?: 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  year?: number; // 2026
  page?: number;
  pageSize?: number;
  sortBy?: 'submittedDate' | 'startDate' | 'employeeName' | 'totalDays' | 'status';
  sortDirection?: 'asc' | 'desc';
}

export interface LeaveQueryResult {
  requests: LeaveRequest[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: LeaveSummaryStats;
  dateRangeLabel: string;
}
