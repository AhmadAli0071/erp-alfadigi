import {
  AttendanceRecord,
  AttendanceTrendPoint,
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

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

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
  pendingRequestsCount: 0,
  openTicketsCount: 0,
  pendingTicketsCount: 0,
  pendingLeavesCount: 0,
  pendingCorrectionsCount: 0,
  pendingOvertimeCount: 0,
  pendingExtraHoursTotalTime: '—',
  pendingExtraHoursEmployeesCount: 0,
};

class HRDashboardService {
  private pendingActionsState: PendingActionItem[] = [];
  private notificationsState: HRNotification[] = [];
  private attendanceState: AttendanceRecord[] = [];
  private activitiesState: HRActivityItem[] = [];
  private employeesState: Employee[] = [];

  public async getDashboardData(simulateError = false): Promise<HRDashboardData> {
    if (simulateError) {
      throw new Error('Unable to load dashboard data.');
    }

    // Fetch employees from real API
    let employees: Employee[] = [];
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        employees = data.employees || [];
      }
    } catch {
      employees = [];
    }

    this.employeesState = employees;

    return {
      kpis: {
        ...EMPTY_DASHBOARD_KPIS,
        totalEmployees: employees.length,
        pendingRequestsCount: this.pendingActionsState.filter(a => a.status === 'Pending').length,
        pendingLeavesCount: this.pendingActionsState.filter(a => a.type === 'LEAVE_REQUEST' && a.status === 'Pending').length,
        pendingCorrectionsCount: this.pendingActionsState.filter(a => a.type === 'ATTENDANCE_CORRECTION' && a.status === 'Pending').length,
        pendingOvertimeCount: this.pendingActionsState.filter(a => a.type === 'EXTRA_HOURS' && a.status === 'Pending').length,
      },
      todayAttendance: [...this.attendanceState],
      pendingActions: [...this.pendingActionsState],
      leaveOverview: [],
      departmentSummary: [],
      attendanceTrend: [],
      recentActivities: [...this.activitiesState],
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

  public async approveAction(actionId: string, note?: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const target = this.pendingActionsState.find((a) => a.id === actionId);
    if (!target) return { success: false, message: 'Action item not found.' };

    target.status = 'Approved';

    if (target.type === 'EXTRA_HOURS') {
      const att = this.attendanceState.find((r) => r.employeeId === target.employeeId);
      if (att && att.status === 'Pending OT') att.status = 'Present';
    }

    this.activitiesState.unshift({
      id: `act_log_${Date.now()}`,
      title: `${target.requestType} Approved`,
      description: `HR Admin approved ${target.employeeName}'s ${target.requestType.toLowerCase()}${note ? ` (${note})` : ''}.`,
      timestamp: 'Just now',
      category: target.type === 'LEAVE_REQUEST' ? 'LEAVE' : 'ATTENDANCE',
      actorName: 'HR Admin',
      actorRole: 'HR Admin',
    });

    return { success: true, message: `Successfully approved ${target.requestType} for ${target.employeeName}.` };
  }

  public async rejectAction(actionId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const target = this.pendingActionsState.find((a) => a.id === actionId);
    if (!target) return { success: false, message: 'Action item not found.' };

    target.status = 'Rejected';

    this.activitiesState.unshift({
      id: `act_log_${Date.now()}`,
      title: `${target.requestType} Rejected`,
      description: `HR Admin rejected ${target.employeeName}'s request${reason ? `: "${reason}"` : ''}.`,
      timestamp: 'Just now',
      category: target.type === 'LEAVE_REQUEST' ? 'LEAVE' : 'ATTENDANCE',
      actorName: 'HR Admin',
      actorRole: 'HR Admin',
    });

    return { success: true, message: `Rejected ${target.requestType} for ${target.employeeName}.` };
  }

  public async getNotifications(): Promise<HRNotification[]> {
    return [...this.notificationsState];
  }

  public async markNotificationRead(id: string): Promise<void> {
    const notif = this.notificationsState.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  }

  public async markAllNotificationsRead(): Promise<void> {
    this.notificationsState.forEach((n) => (n.isRead = true));
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
          title: `${att.employeeName} — ${att.attendanceDate}`,
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
            title: `${lr.employeeName} — ${lr.requestType}`,
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
