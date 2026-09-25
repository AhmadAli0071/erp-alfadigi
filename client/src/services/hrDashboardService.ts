import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceTrendPoint,
  CompanyAttendanceSummary,
  DepartmentName,
  DepartmentSummaryItem,
  Employee,
  GlobalSearchResult,
  HRActivityItem,
  HRDashboardKPIs,
  HRNotification,
  LeaveOverviewCategory,
  PendingActionItem,
} from '../types/hr';
import {
  AttendanceFilterParams,
  AttendanceQueryResult,
  queryAttendanceRecords,
} from './hrAttendanceGenerator';
import { AppNotification } from './notificationService';
import { formatDateShort } from './hrAttendanceGenerator';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

interface EmployeesResponse {
  employees?: Employee[];
}

interface AttendanceHrResponse {
  records?: AttendanceRecord[];
  companySummary?: CompanyAttendanceSummary | null;
}

interface LeavesHrResponse {
  leaves?: HrLeaveRecord[];
}

interface CountResponse {
  count?: number;
}

interface NotificationsResponse {
  notifications?: AppNotification[];
}

export interface AttendanceReviewItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: DepartmentName;
  date: string;
  dateLabel: string;
  clockIn: string | null;
  clockOut: string | null;
  workingMinutes: number;
  extraMinutes: number;
  status: string;
  reason: string;
  submittedAt: string;
}

interface PendingReviewResponse {
  corrections?: { count: number; items?: AttendanceReviewItem[] };
  overtime?: { count: number; totalMinutes: number; employees: number; items?: AttendanceReviewItem[] };
}

interface HrLeaveRecord {
  id: string;
  employeeId: string | { _id?: string };
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  hrActionable?: boolean;
  leadApprovalDate?: string;
  createdAt: string;
}

export interface HRDashboardData {
  kpis: HRDashboardKPIs;
  todayAttendance: AttendanceRecord[];
  pendingActions: PendingActionItem[];
  leaveOverview: LeaveOverviewCategory[];
  departmentSummary: DepartmentSummaryItem[];
  attendanceTrend: AttendanceTrendPoint[];
  recentActivities: HRActivityItem[];
  employees: Employee[];
}

export const EMPTY_DASHBOARD_KPIS: HRDashboardKPIs = {
  totalEmployees: 0,
  presentToday: 0,
  absentToday: 0,
  onLeaveToday: 0,
  lateOrShortHoursToday: 0,
  halfDayToday: 0,
  workFromHomeToday: 0,
  avgWorkingHoursToday: '00:00',
  shortHoursTotalToday: '00:00',
  pendingRequestsCount: 0,
  openTicketsCount: 0,
  pendingTicketsCount: 0,
  pendingLeavesCount: 0,
  pendingCorrectionsCount: 0,
  pendingOvertimeCount: 0,
  pendingExtraHoursTotalTime: '-',
  pendingExtraHoursEmployeesCount: 0,
};

const PRESENT_LIKE_STATUSES: AttendanceStatus[] = ['Present', 'Late', 'Short Hours', 'On Duty', 'Pending OT'];

const DEPARTMENTS: DepartmentName[] = ['HR', 'Sales', 'Tech'];

const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatDayLabel = (value: string): string => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : formatDateShort(d);
};

const parseHM = (value?: string): number => {
  if (!value) return 0;
  const [h, m] = value.split(':').map((part) => parseInt(part, 10));
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
};

const formatHM = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const fetchJson = async <TResponse>(url: string): Promise<TResponse | null> => {
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as TResponse;
  } catch {
    return null;
  }
};

const normalizeLeaveEmployeeId = (value: HrLeaveRecord['employeeId']): string => {
  if (typeof value === 'string') return value;
  return value?._id ? String(value._id) : '';
};

const NOTIFICATION_CATEGORY: Record<AppNotification['type'], HRActivityItem['category']> = {
  leave: 'LEAVE',
  ticket: 'TICKET',
  attendance: 'ATTENDANCE',
  general: 'SYSTEM',
};

const NOTIFICATION_BADGE_TYPE: Record<AppNotification['type'], HRNotification['type']> = {
  leave: 'LEAVE',
  ticket: 'TICKET',
  attendance: 'CORRECTION',
  general: 'INFO',
};

class HRDashboardService {
  private pendingActionsState: PendingActionItem[] = [];
  private notificationsState: AppNotification[] = [];
  private attendanceState: AttendanceRecord[] = [];
  private activitiesState: HRActivityItem[] = [];
  private employeesState: Employee[] = [];

  public async getDashboardData(simulateError = false): Promise<HRDashboardData> {
    if (simulateError) {
      throw new Error('Unable to load dashboard data.');
    }

    const [employeesRes, attendanceRes, leavesRes, ticketsRes, notificationsRes, reviewRes] = await Promise.all([
      fetchJson<EmployeesResponse>(`${API_BASE}/employees`),
      fetchJson<AttendanceHrResponse>(`${API_BASE}/attendance/hr?preset=today&pageSize=100`),
      fetchJson<LeavesHrResponse>(`${API_BASE}/leaves/hr?status=ALL`),
      fetchJson<CountResponse>(`${API_BASE}/tickets/hr-count`),
      fetchJson<NotificationsResponse>(`${API_BASE}/notifications`),
      fetchJson<PendingReviewResponse>(`${API_BASE}/attendance/hr/pending-review`),
    ]);

    const employees = employeesRes?.employees ?? [];
    const records = attendanceRes?.records ?? [];
    const companySummary = attendanceRes?.companySummary ?? null;
    const leaves = leavesRes?.leaves ?? [];
    const awaitingTickets = ticketsRes?.count ?? 0;
    const notifications = notificationsRes?.notifications ?? [];
    const pendingCorrections = reviewRes?.corrections ?? { count: 0, items: [] };
    const pendingOvertime = reviewRes?.overtime ?? { count: 0, totalMinutes: 0, employees: 0, items: [] };

    this.employeesState = employees;
    this.attendanceState = records;
    this.notificationsState = notifications;

    // ----- Pending actions (leaves awaiting HR action: lead-approved, in-process, or direct-to-HR pending) -----
    const leaveActions: PendingActionItem[] = leaves
      .filter((l) => ['Approved', 'In Process'].includes(l.status) || (l.status === 'Pending' && l.hrActionable === true))
      .map((l) => ({
      id: String(l.id),
      type: 'LEAVE_REQUEST',
      employeeId: normalizeLeaveEmployeeId(l.employeeId),
      employeeName: l.employeeName || 'Unknown',
      employeeCode: l.employeeCode || '-',
      department: ((l.department || 'HR') as DepartmentName),
      requestType: l.leaveType,
      details: `${l.totalDays} ${l.totalDays === 1 ? 'Day' : 'Days'} (${formatDayLabel(l.startDate)} → ${formatDayLabel(l.endDate)})`,
      date: formatDayLabel(l.startDate),
      status: 'Pending',
      submissionTime: timeAgo(l.createdAt) || 'Recently',
      appliedByLead: l.leadApprovalDate ? timeAgo(l.leadApprovalDate) : undefined,
    }));

    // ----- Pending actions: attendance corrections requested by employees -----
    const correctionActions: PendingActionItem[] = (pendingCorrections.items ?? []).map((c) => ({
      id: c.id,
      type: 'ATTENDANCE_CORRECTION',
      employeeId: c.employeeId,
      employeeName: c.employeeName,
      employeeCode: c.employeeCode,
      department: c.department,
      requestType: 'Attendance Correction',
      details: c.reason,
      date: c.dateLabel,
      status: 'Pending',
      submissionTime: timeAgo(c.submittedAt) || 'Recently',
    }));

    // ----- Pending actions: overtime approvals requested by employees -----
    const overtimeActions: PendingActionItem[] = (pendingOvertime.items ?? []).map((o) => ({
      id: o.id,
      type: 'EXTRA_HOURS',
      employeeId: o.employeeId,
      employeeName: o.employeeName,
      employeeCode: o.employeeCode,
      department: o.department,
      requestType: 'Overtime Approval',
      details: `${o.reason}, ${formatHM(o.extraMinutes)} extra`,
      date: o.dateLabel,
      status: 'Pending',
      submissionTime: timeAgo(o.submittedAt) || 'Recently',
      extraTimeAmount: formatHM(o.extraMinutes),
    }));

    const pendingActions: PendingActionItem[] = [...correctionActions, ...overtimeActions, ...leaveActions];
    this.pendingActionsState = pendingActions;

    // ----- Attendance KPIs (today) -----
    const countByStatus = (status: AttendanceStatus): number =>
      records.filter((r) => r.status === status).length;

    const lateCount = countByStatus('Late');
    const shortCount = countByStatus('Short Hours');
    const lateOrShortHoursToday = lateCount + shortCount;

    const presentLike = companySummary
      ? companySummary.presentCount
      : records.filter((r) => PRESENT_LIKE_STATUSES.includes(r.status)).length;
    const presentToday = Math.max(0, presentLike - lateOrShortHoursToday);
    const onLeaveToday = companySummary ? companySummary.leaveCount : countByStatus('Leave');
    const workFromHomeToday = companySummary ? companySummary.wfhCount : countByStatus('Work From Home');
    const halfDayToday = companySummary ? companySummary.halfDayCount : countByStatus('Half Day');
    const absentCounted = companySummary ? companySummary.absentCount : countByStatus('Absent');
    const accounted = presentLike + workFromHomeToday + onLeaveToday + halfDayToday;
    const absentToday = Math.max(absentCounted, employees.length - accounted, 0);

    const workedRecords = records.filter((r) => parseHM(r.workingHours) > 0);
    const avgWorkingMinutes = workedRecords.length
      ? Math.round(workedRecords.reduce((acc, r) => acc + parseHM(r.workingHours), 0) / workedRecords.length)
      : 0;
    const shortTotalMinutes = records.reduce((acc, r) => acc + parseHM(r.shortHours), 0);
    const extraRecords = records.filter((r) => parseHM(r.extraHours) > 0);
    const extraTotalMinutes = extraRecords.reduce((acc, r) => acc + parseHM(r.extraHours), 0);
    const extraEmployees = new Set(extraRecords.map((r) => r.employeeId));

    // ----- Department summary (today) -----
    const departmentSummary: DepartmentSummaryItem[] = DEPARTMENTS.map((dept) => {
      const total = employees.filter((e) => e.department === dept).length;
      const deptRecords = records.filter((r) => r.department === dept);
      const present = deptRecords.filter((r) => PRESENT_LIKE_STATUSES.includes(r.status)).length;
      const onLeave = deptRecords.filter((r) => r.status === 'Leave').length;
      const wfh = deptRecords.filter((r) => r.status === 'Work From Home').length;
      const absent = Math.max(0, total - present - onLeave - wfh);
      return {
        department: dept,
        totalEmployees: total,
        present,
        absent,
        onLeave,
        wfh,
        attendanceRate: total ? Math.round((present / total) * 100) : 0,
      };
    });

    // ----- Recent activities from real notifications -----
    const recentActivities: HRActivityItem[] = notifications.slice(0, 6).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.message,
      timestamp: timeAgo(n.createdAt) || 'Recently',
      category: NOTIFICATION_CATEGORY[n.type] ?? 'SYSTEM',
      actorName: 'System',
      actorRole: 'System',
    }));
    this.activitiesState = recentActivities;

    const pendingLeavesCount = leaveActions.length;
    const pendingTicketsCount = awaitingTickets;

    // Pending OT totals drive the "pending extra hours" widgets; fall back to
    // today's unverified extra hours when no explicit OT requests exist.
    const pendingOtMinutes = pendingOvertime.count > 0 ? pendingOvertime.totalMinutes : extraTotalMinutes;
    const pendingOtEmployees = pendingOvertime.count > 0 ? pendingOvertime.employees : extraEmployees.size;

    const kpis: HRDashboardKPIs = {
      totalEmployees: employees.length,
      presentToday,
      absentToday,
      onLeaveToday,
      lateOrShortHoursToday,
      halfDayToday,
      workFromHomeToday,
      avgWorkingHoursToday: formatHM(avgWorkingMinutes),
      shortHoursTotalToday: formatHM(shortTotalMinutes),
      pendingRequestsCount: pendingLeavesCount + pendingTicketsCount + pendingCorrections.count + pendingOvertime.count,
      openTicketsCount: awaitingTickets,
      pendingTicketsCount,
      pendingLeavesCount,
      pendingCorrectionsCount: pendingCorrections.count,
      pendingOvertimeCount: pendingOvertime.count,
      pendingExtraHoursTotalTime: pendingOtMinutes > 0 ? formatHM(pendingOtMinutes) : '-',
      pendingExtraHoursEmployeesCount: pendingOtEmployees,
    };

    return {
      kpis,
      todayAttendance: [...records],
      pendingActions: [...pendingActions],
      leaveOverview: [],
      departmentSummary,
      attendanceTrend: [],
      recentActivities,
      employees,
    };
  }

  public async getTodayAttendance(): Promise<AttendanceRecord[]> {
    return [...this.attendanceState];
  }

  public async queryAttendance(params: AttendanceFilterParams): Promise<AttendanceQueryResult> {
    return queryAttendanceRecords(params);
  }

  public exportAttendanceCSV(records: AttendanceRecord[], filename = 'attendance_report.csv'): void {
    const headers = [
      'Shift Date', 'Employee Code', 'Employee Name', 'Department',
      'Clock In Time', 'Clock In Date', 'Clock Out Time', 'Clock Out Date',
      'Break Duration', 'Working Hours', 'Short Hours', 'Extra Hours',
      'Status', 'Notes',
    ];

    const rows = records.map((r) => [
      `"${r.attendanceDate}"`, `"${r.employeeCode}"`, `"${r.employeeName}"`,
      `"${r.department}"`, `"${r.clockInTime}"`, `"${r.clockInDate}"`,
      `"${r.clockOutTime}"`, `"${r.clockOutDate}"`, `"${r.breakDuration}"`,
      `"${r.workingHours}"`, `"${r.shortHours}"`, `"${r.extraHours}"`,
      `"${r.status}"`, `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async putLeaveAction(leaveId: string, action: 'hr-approve' | 'hr-reject', note?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ note: note || '' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async putAttendanceReview(
    attendanceId: string,
    kind: 'correction' | 'ot',
    decision: 'APPROVED' | 'REJECTED',
    note?: string,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/attendance/hr/${attendanceId}/${kind}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ action: decision, note: note || '' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async approveAction(actionId: string, note?: string): Promise<{ success: boolean; message: string }> {
    const target = this.pendingActionsState.find((a) => a.id === actionId);
    if (!target) return { success: false, message: 'Action item not found.' };

    let ok: boolean;
    if (target.type === 'ATTENDANCE_CORRECTION') {
      ok = await this.putAttendanceReview(actionId, 'correction', 'APPROVED', note);
    } else if (target.type === 'EXTRA_HOURS') {
      ok = await this.putAttendanceReview(actionId, 'ot', 'APPROVED', note);
    } else {
      ok = await this.putLeaveAction(actionId, 'hr-approve', note);
    }
    if (!ok) return { success: false, message: 'Server could not approve this request.' };

    this.pendingActionsState = this.pendingActionsState.filter((a) => a.id !== actionId);

    const isAttendanceReview = target.type !== 'LEAVE_REQUEST';
    this.activitiesState.unshift({
      id: `act_log_${Date.now()}`,
      title: isAttendanceReview ? `${target.requestType} Approved` : `${target.requestType} Approved`,
      description: isAttendanceReview
        ? `${target.requestType} approved for ${target.employeeName} (${target.date})${note ? `: "${note}"` : ''}.`
        : `Final HR approval granted for ${target.employeeName}'s ${target.requestType.toLowerCase()}${note ? ` - "${note}"` : ''}.`,
      timestamp: 'Just now',
      category: isAttendanceReview ? 'ATTENDANCE' : 'LEAVE',
      actorName: 'HR Admin',
      actorRole: 'HR Admin',
    });

    return { success: true, message: `Successfully approved ${target.requestType} for ${target.employeeName}.` };
  }

  public async rejectAction(actionId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const target = this.pendingActionsState.find((a) => a.id === actionId);
    if (!target) return { success: false, message: 'Action item not found.' };

    let ok: boolean;
    if (target.type === 'ATTENDANCE_CORRECTION') {
      ok = await this.putAttendanceReview(actionId, 'correction', 'REJECTED', reason);
    } else if (target.type === 'EXTRA_HOURS') {
      ok = await this.putAttendanceReview(actionId, 'ot', 'REJECTED', reason);
    } else {
      ok = await this.putLeaveAction(actionId, 'hr-reject', reason);
    }
    if (!ok) return { success: false, message: 'Server could not reject this request.' };

    this.pendingActionsState = this.pendingActionsState.filter((a) => a.id !== actionId);

    const isAttendanceReview = target.type !== 'LEAVE_REQUEST';
    this.activitiesState.unshift({
      id: `act_log_${Date.now()}`,
      title: `${target.requestType} Rejected`,
      description: isAttendanceReview
        ? `${target.requestType} for ${target.employeeName} (${target.date}) rejected${reason ? `: "${reason}"` : ''}.`
        : `HR Admin rejected ${target.employeeName}'s request${reason ? `: "${reason}"` : ''}.`,
      timestamp: 'Just now',
      category: isAttendanceReview ? 'ATTENDANCE' : 'LEAVE',
      actorName: 'HR Admin',
      actorRole: 'HR Admin',
    });

    return { success: true, message: `Rejected ${target.requestType} for ${target.employeeName}.` };
  }

  public async getNotifications(): Promise<HRNotification[]> {
    const data = await fetchJson<NotificationsResponse>(`${API_BASE}/notifications`);
    const items = data?.notifications ?? [];
    this.notificationsState = items;
    return items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timeAgo: timeAgo(n.createdAt) || 'Recently',
      type: NOTIFICATION_BADGE_TYPE[n.type],
      isRead: n.isRead,
      actionUrl: undefined,
      relatedId: n.relatedId,
    }));
  }

  public async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
      const notif = this.notificationsState.find((n) => n.id === id);
      if (notif) notif.isRead = true;
    } catch {
      // ignore
    }
  }

  public async markAllNotificationsRead(): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: getHeaders() });
      this.notificationsState.forEach((n) => (n.isRead = true));
    } catch {
      // ignore
    }
  }

  public async searchGlobal(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    this.employeesState.forEach((emp) => {
      if (
        emp.name.toLowerCase().includes(q) ||
        emp.empId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q)
      ) {
        results.push({
          id: emp.id,
          category: 'Employees',
          title: emp.name,
          subtitle: `${emp.empId} • ${emp.jobTitle} (${emp.department})`,
          badge: emp.status,
          linkRoute: `/hr/employees/all?id=${emp.id}`,
        });
      }
    });

    this.attendanceState.forEach((att) => {
      if (
        att.employeeName.toLowerCase().includes(q) ||
        att.employeeCode.toLowerCase().includes(q) ||
        att.status.toLowerCase().includes(q)
      ) {
        results.push({
          id: att.id,
          category: 'Attendance',
          title: `${att.employeeName}, ${att.attendanceDate}`,
          subtitle: `In: ${att.clockInTime} | Out: ${att.clockOutTime} | Status: ${att.status}`,
          badge: att.status,
          linkRoute: `/hr/attendance/today?emp=${att.employeeCode}`,
        });
      }
    });

    this.pendingActionsState
      .filter((a) => a.type === 'LEAVE_REQUEST')
      .forEach((lr) => {
        if (
          lr.employeeName.toLowerCase().includes(q) ||
          lr.requestType.toLowerCase().includes(q) ||
          lr.details.toLowerCase().includes(q)
        ) {
          results.push({
            id: lr.id,
            category: 'Leave Requests',
            title: `${lr.employeeName}, ${lr.requestType}`,
            subtitle: `${lr.details} (${lr.date})`,
            badge: lr.status,
            linkRoute: `/hr/leaves/requests?id=${lr.id}`,
          });
        }
      });

    return results.slice(0, 8);
  }
}

export const hrDashboardService = new HRDashboardService();
