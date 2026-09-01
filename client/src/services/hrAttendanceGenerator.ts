import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceTimelineEvent,
  CompanyAttendanceSummary,
  Employee,
  EmployeeAttendanceSummary,
} from '../types/hr';

// Month names and helpers
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface AttendanceFilterParams {
  datePreset?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'last_7_days' | 'this_month' | 'last_month' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  employeeId?: string; // 'ALL' or emp_id
  department?: string; // 'ALL' | 'HR' | 'Sales' | 'Tech'
  status?: string; // 'ALL' | AttendanceStatus
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AttendanceQueryResult {
  records: AttendanceRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  employeeSummary?: EmployeeAttendanceSummary;
  companySummary?: CompanyAttendanceSummary;
  dateRangeLabel: string;
}

/**
 * Format a Date object to "DD Mon YYYY" (e.g., "31 Aug 2026")
 */
export function formatDateLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
}

/**
 * Format a Date object to "DD Mon" (e.g., "31 Aug")
 */
export function formatDateShort(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  return `${day} ${mon}`;
}

/**
 * Format a Date object to "YYYY-MM-DD"
 */
export function formatISODate(d: Date): string {
  const yr = d.getFullYear();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mon}-${day}`;
}

/**
 * Parses YYYY-MM-DD string to Date at noon to avoid timezone shift
 */
export function parseISODate(str: string): Date {
  const [yr, mon, day] = str.split('-').map(Number);
  return new Date(yr, mon - 1, day, 12, 0, 0);
}

/**
 * Generate timeline events for a given punch
 */
export function generateTimeline(
  recordDateShort: string,
  nextDateShort: string,
  inTime: string,
  outTime: string,
  status: AttendanceStatus,
  notes?: string
): AttendanceTimelineEvent[] {
  if (status === 'Absent' || status === 'Leave' || status === 'Weekend' || status === 'Holiday') {
    return [
      {
        id: `tl_${Math.random().toString(36).substring(2, 9)}`,
        time: '—',
        date: recordDateShort,
        type: 'SYSTEM_FLAG',
        label: `Status: ${status}`,
        notes: notes || `Recorded as ${status} in roster`,
      },
    ];
  }

  return [
    {
      id: `tl_1_${Math.random().toString(36).substring(2, 9)}`,
      time: inTime,
      date: recordDateShort,
      type: 'CLOCK_IN',
      label: 'Shift Punch In',
      notes: inTime.includes('05:') ? 'Early arrival punch' : 'Biometric fingerprint punch verified',
    },
    {
      id: `tl_2_${Math.random().toString(36).substring(2, 9)}`,
      time: '08:30 PM',
      date: recordDateShort,
      type: 'PAUSE',
      label: 'Meal Break Started',
      notes: 'Break duration: 30 minutes',
    },
    {
      id: `tl_3_${Math.random().toString(36).substring(2, 9)}`,
      time: '09:00 PM',
      date: recordDateShort,
      type: 'RESUME',
      label: 'Resumed Work',
      notes: 'Returned from meal break on time',
    },
    {
      id: `tl_4_${Math.random().toString(36).substring(2, 9)}`,
      time: '12:00 AM',
      date: nextDateShort,
      type: 'PAUSE',
      label: 'Night Tea / Coffee Break',
      notes: 'Break duration: 30 minutes',
    },
    {
      id: `tl_5_${Math.random().toString(36).substring(2, 9)}`,
      time: '12:30 AM',
      date: nextDateShort,
      type: 'RESUME',
      label: 'Resumed Work (Post Midnight)',
      notes: 'Resumed second half of overnight shift',
    },
    {
      id: `tl_6_${Math.random().toString(36).substring(2, 9)}`,
      time: outTime,
      date: nextDateShort,
      type: 'CLOCK_OUT',
      label: 'Shift Punch Out',
      notes: notes || 'Regular shift completed. 8h net duty verified.',
    },
  ];
}

/**
 * Get date bounds based on preset
 */
export function getDateRangeFromPreset(
  preset: string,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
        label: `Today (${formatDateLabel(today)})`,
      };
    case 'yesterday': {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return {
        startDate: yest,
        endDate: yest,
        label: `Yesterday (${formatDateLabel(yest)})`,
      };
    }
    case 'this_week': {
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      return {
        startDate: startOfWeek,
        endDate: today,
        label: `This Week (${formatDateShort(startOfWeek)} – ${formatDateShort(today)})`,
      };
    }
    case 'last_week': {
      const endOfLastWeek = new Date(today);
      const day = endOfLastWeek.getDay();
      const diff = endOfLastWeek.getDate() - day + (day === 0 ? -7 : 0);
      endOfLastWeek.setDate(diff);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return {
        startDate: startOfLastWeek,
        endDate: endOfLastWeek,
        label: `Last Week (${formatDateShort(startOfLastWeek)} – ${formatDateShort(endOfLastWeek)})`,
      };
    }
    case 'last_7_days': {
      const start7 = new Date(today);
      start7.setDate(today.getDate() - 6);
      return {
        startDate: start7,
        endDate: today,
        label: `Last 7 Days (${formatDateShort(start7)} – ${formatDateShort(today)})`,
      };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: startOfMonth,
        endDate: today,
        label: `This Month (${formatDateShort(startOfMonth)} – ${formatDateShort(today)})`,
      };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        label: `Last Month (${formatDateShort(startOfLastMonth)} – ${formatDateShort(endOfLastMonth)})`,
      };
    }
    case 'custom':
      if (customStart && customEnd) {
        const s = parseISODate(customStart);
        const e = parseISODate(customEnd);
        return {
          startDate: s,
          endDate: e,
          label: `Custom (${formatDateShort(s)} – ${formatDateShort(e)})`,
        };
      }
      return {
        startDate: today,
        endDate: today,
        label: `Custom (${formatDateLabel(today)})`,
      };
    default:
      return {
        startDate: today,
        endDate: today,
        label: `Today (${formatDateLabel(today)})`,
      };
  }
}

// In-memory registered attendance repository
const registeredAttendanceRecords: AttendanceRecord[] = [];

/**
 * Query attendance records with filters & summary calculations
 */
export function queryAttendanceRecords(params: AttendanceFilterParams): AttendanceQueryResult {
  const {
    datePreset = 'today',
    startDate: customStart,
    endDate: customEnd,
    employeeId = 'ALL',
    department = 'ALL',
    status = 'ALL',
    searchQuery = '',
    page = 1,
    pageSize = 20,
    sortBy = 'date',
    sortDirection = 'desc',
  } = params;

  const { label: dateRangeLabel } = getDateRangeFromPreset(
    datePreset,
    customStart,
    customEnd
  );

  // Filter existing registered records
  let filteredRecords = registeredAttendanceRecords.filter((rec) => {
    if (department !== 'ALL' && rec.department !== department) {
      return false;
    }
    if (employeeId !== 'ALL' && rec.employeeId !== employeeId && rec.employeeCode !== employeeId) {
      return false;
    }
    if (status !== 'ALL') {
      if (status === 'Late' && rec.status !== 'Late' && rec.status !== 'Short Hours') return false;
      if (status !== 'Late' && rec.status !== status) return false;
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = rec.employeeName.toLowerCase().includes(q);
      const matchCode = rec.employeeCode.toLowerCase().includes(q);
      const matchDept = rec.department.toLowerCase().includes(q);
      const matchStatus = rec.status.toLowerCase().includes(q);
      const matchDate = rec.attendanceDate.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept && !matchStatus && !matchDate) {
        return false;
      }
    }
    return true;
  });

  // Sort
  filteredRecords.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'date') {
      comp = new Date(a.attendanceDate).getTime() - new Date(b.attendanceDate).getTime();
    } else if (sortBy === 'employeeName') {
      comp = a.employeeName.localeCompare(b.employeeName);
    } else if (sortBy === 'department') {
      comp = a.department.localeCompare(b.department);
    } else if (sortBy === 'workingHours') {
      comp = a.workingHours.localeCompare(b.workingHours);
    }
    return sortDirection === 'asc' ? comp : -comp;
  });

  // Calculate summaries
  let employeeSummary: EmployeeAttendanceSummary | undefined = undefined;
  let companySummary: CompanyAttendanceSummary | undefined = undefined;

  if (filteredRecords.length > 0) {
    if (employeeId !== 'ALL') {
      const present = filteredRecords.filter((r) => r.status === 'Present' || r.status === 'Pending OT' || r.status === 'Late' || r.status === 'Short Hours').length;
      const absent = filteredRecords.filter((r) => r.status === 'Absent').length;
      const leave = filteredRecords.filter((r) => r.status === 'Leave').length;
      const wfh = filteredRecords.filter((r) => r.status === 'Work From Home').length;
      const halfDays = filteredRecords.filter((r) => r.status === 'Half Day').length;

      let totalWorkMinutes = 0;
      let totalShortMinutes = 0;
      let totalExtraMinutes = 0;

      filteredRecords.forEach((r) => {
        if (r.workingHours && r.workingHours !== '00:00' && r.workingHours !== '—') {
          const [h, m] = r.workingHours.split(':').map(Number);
          totalWorkMinutes += (h || 0) * 60 + (m || 0);
        }
        if (r.shortHours && r.shortHours !== '00:00' && r.shortHours !== '—') {
          const [h, m] = r.shortHours.split(':').map(Number);
          totalShortMinutes += (h || 0) * 60 + (m || 0);
        }
        if (r.extraHours && r.extraHours !== '00:00' && r.extraHours !== '—') {
          const [h, m] = r.extraHours.split(':').map(Number);
          totalExtraMinutes += (h || 0) * 60 + (m || 0);
        }
      });

      const activeDaysCount = present + wfh + (halfDays ? 0.5 : 0) || 1;
      const avgMins = Math.round(totalWorkMinutes / activeDaysCount);
      const avgHrs = Math.floor(avgMins / 60);
      const avgRemMins = avgMins % 60;
      const avgStr = `${avgHrs}h ${String(avgRemMins).padStart(2, '0')}m`;

      const shortHrs = Math.floor(totalShortMinutes / 60);
      const shortRemMins = totalShortMinutes % 60;
      const shortStr = `${shortHrs}h ${String(shortRemMins).padStart(2, '0')}m`;

      const extraHrs = Math.floor(totalExtraMinutes / 60);
      const extraRemMins = totalExtraMinutes % 60;
      const extraStr = `${extraHrs}h ${String(extraRemMins).padStart(2, '0')}m`;

      employeeSummary = {
        employee: {
          id: filteredRecords[0].employeeId,
          empId: filteredRecords[0].employeeCode,
          name: filteredRecords[0].employeeName,
          email: '',
          department: filteredRecords[0].department,
          jobTitle: filteredRecords[0].designation || 'Staff',
          joinedDate: '',
          status: 'Active',
        },
        periodLabel: dateRangeLabel,
        workingDays: filteredRecords.length,
        presentDays: present,
        absentDays: absent,
        leaveDays: leave,
        wfhDays: wfh,
        halfDays,
        avgWorkingHours: avgStr,
        totalShortHours: shortStr,
        approvedExtraHours: extraStr,
        pendingExtraHours: '0m',
      };
    } else {
      const present = filteredRecords.filter((r) => r.status === 'Present' || r.status === 'Pending OT' || r.status === 'Late' || r.status === 'Short Hours').length;
      const absent = filteredRecords.filter((r) => r.status === 'Absent').length;
      const leave = filteredRecords.filter((r) => r.status === 'Leave').length;
      const wfh = filteredRecords.filter((r) => r.status === 'Work From Home').length;
      const halfDay = filteredRecords.filter((r) => r.status === 'Half Day').length;

      let totalWorkMinutes = 0;
      let totalShortMinutes = 0;
      let totalExtraMinutes = 0;

      filteredRecords.forEach((r) => {
        if (r.workingHours && r.workingHours !== '00:00' && r.workingHours !== '—') {
          const [h, m] = r.workingHours.split(':').map(Number);
          totalWorkMinutes += (h || 0) * 60 + (m || 0);
        }
        if (r.shortHours && r.shortHours !== '00:00' && r.shortHours !== '—') {
          const [h, m] = r.shortHours.split(':').map(Number);
          totalShortMinutes += (h || 0) * 60 + (m || 0);
        }
        if (r.extraHours && r.extraHours !== '00:00' && r.extraHours !== '—') {
          const [h, m] = r.extraHours.split(':').map(Number);
          totalExtraMinutes += (h || 0) * 60 + (m || 0);
        }
      });

      const activeCount = present + wfh + (halfDay ? 0.5 : 0) || 1;
      const avgMins = Math.round(totalWorkMinutes / activeCount);
      const avgHrs = Math.floor(avgMins / 60);
      const avgRemMins = avgMins % 60;
      const avgStr = totalWorkMinutes > 0 ? `${avgHrs}h ${String(avgRemMins).padStart(2, '0')}m` : '—';

      const shortHrs = Math.floor(totalShortMinutes / 60);
      const shortRemMins = totalShortMinutes % 60;
      const shortStr = totalShortMinutes > 0 ? `${shortHrs}h ${String(shortRemMins).padStart(2, '0')}m` : '0h 00m';

      const extraHrs = Math.floor(totalExtraMinutes / 60);
      const extraRemMins = totalExtraMinutes % 60;
      const extraStr = totalExtraMinutes > 0 ? `${extraHrs}h ${String(extraRemMins).padStart(2, '0')}m` : '0h 00m';

      companySummary = {
        periodLabel: dateRangeLabel,
        totalRecords: filteredRecords.length,
        presentCount: present,
        absentCount: absent,
        leaveCount: leave,
        wfhCount: wfh,
        halfDayCount: halfDay,
        avgWorkingHours: avgStr,
        totalShortHours: shortStr,
        totalApprovedExtraHours: extraStr,
        attendanceRate: Math.round(((present + wfh) / (filteredRecords.length || 1)) * 100),
      };
    }
  } else {
    // Clean empty company summary when no records exist
    companySummary = {
      periodLabel: dateRangeLabel,
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      leaveCount: 0,
      wfhCount: 0,
      halfDayCount: 0,
      avgWorkingHours: '—',
      totalShortHours: '—',
      totalApprovedExtraHours: '—',
      attendanceRate: 0,
    };
  }

  // Pagination
  const totalCount = filteredRecords.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  return {
    records: paginatedRecords,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
    employeeSummary,
    companySummary,
    dateRangeLabel,
  };
}

/**
 * Register a new attendance record into the in-memory repository
 */
export function registerAttendanceRecord(record: AttendanceRecord): void {
  registeredAttendanceRecords.unshift(record);
}
