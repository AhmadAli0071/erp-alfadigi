export type ReportCategory =
  | 'attendance'
  | 'leave'
  | 'overtime'
  | 'employee'
  | 'department'
  | 'activity';

export interface ReportCategoryCard {
  id: ReportCategory;
  title: string;
  description: string;
  badge?: string;
  iconName: string;
}

export interface ReportFilterParams {
  category: ReportCategory;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  department?: string;
  status?: string;
  leaveType?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceReportRow {
  id: string;
  date: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  clockIn: string;
  clockOut: string;
  breakDuration: string;
  workingHours: string;
  shortHours: string;
  extraHours: string;
  status: string;
}

export interface LeaveReportRow {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export interface OvertimeReportRow {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  shift: string;
  extraBeforeShift: string;
  extraAfterShift: string;
  totalExtraHours: string;
  verificationStatus: string;
  hrApproval: string;
}

export interface EmployeeReportRow {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: string;
}

export interface DepartmentReportRow {
  id: string;
  department: string;
  totalEmployees: number;
  present: number;
  absent: number;
  onLeave: number;
  workingHours: string;
}

export interface HRActivityReportRow {
  id: string;
  date: string;
  time: string;
  category: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  details: string;
}

export type ReportRow =
  | AttendanceReportRow
  | LeaveReportRow
  | OvertimeReportRow
  | EmployeeReportRow
  | DepartmentReportRow
  | HRActivityReportRow;

export interface ReportQueryResult {
  category: ReportCategory;
  records: ReportRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dateRangeLabel: string;
}
