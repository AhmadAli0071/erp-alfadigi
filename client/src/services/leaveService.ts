import {
  EmployeeLeaveBalance,
  LeaveFilterParams,
  LeaveQueryResult,
  LeaveRequest,
  LeaveSummaryStats,
  LeaveTypePolicy,
} from '../types/leave';
import {
  INITIAL_LEAVE_REQUESTS,
  MOCK_LEAVE_BALANCES,
  MOCK_LEAVE_TYPES,
  getOrCreateEmployeeBalance,
} from '../mock/leaveData';

class LeaveService {
  private requests: LeaveRequest[] = [...INITIAL_LEAVE_REQUESTS];
  private balances: Record<string, EmployeeLeaveBalance> = { ...MOCK_LEAVE_BALANCES };
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getLeaveTypes(): LeaveTypePolicy[] {
    return MOCK_LEAVE_TYPES;
  }

  public getLeaveBalances(employeeId?: string): EmployeeLeaveBalance[] {
    if (employeeId && employeeId !== 'ALL') {
      const balance = this.balances[employeeId] || getOrCreateEmployeeBalance(employeeId);
      return [balance];
    }
    return Object.values(this.balances);
  }

  public getEmployeeBalance(employeeId: string): EmployeeLeaveBalance {
    if (!this.balances[employeeId]) {
      this.balances[employeeId] = getOrCreateEmployeeBalance(employeeId);
    }
    return this.balances[employeeId];
  }

  public getLeaveRequestById(id: string): LeaveRequest | undefined {
    return this.requests.find((r) => r.id === id);
  }

  public getCurrentlyOnLeave(targetDate: string = '2026-08-31'): LeaveRequest[] {
    return this.requests.filter((r) => {
      if (r.status !== 'Approved') return false;
      return r.startDate <= targetDate && r.endDate >= targetDate;
    });
  }

  public getUpcomingLeaves(targetDate: string = '2026-08-31', limit: number = 5): LeaveRequest[] {
    return this.requests
      .filter((r) => r.status === 'Approved' && r.startDate > targetDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, limit);
  }

  public getLeaveRequests(params: LeaveFilterParams = {}): LeaveQueryResult {
    const {
      searchQuery = '',
      employeeId = 'ALL',
      department = 'ALL',
      leaveType = 'ALL',
      status = 'ALL',
      datePreset = 'this_month',
      startDate,
      endDate,
      year = 2026,
      page = 1,
      pageSize = 20,
      sortBy = 'submittedDate',
      sortDirection = 'desc',
    } = params;

    // Determine date boundary based on preset/custom
    let filterStart = startDate;
    let filterEnd = endDate;

    if (datePreset === 'today') {
      filterStart = '2026-08-31';
      filterEnd = '2026-08-31';
    } else if (datePreset === 'this_week') {
      filterStart = '2026-08-31';
      filterEnd = '2026-09-06';
    } else if (datePreset === 'last_week') {
      filterStart = '2026-08-24';
      filterEnd = '2026-08-30';
    } else if (datePreset === 'this_month') {
      filterStart = '2026-08-01';
      filterEnd = '2026-08-31';
    } else if (datePreset === 'last_month') {
      filterStart = '2026-07-01';
      filterEnd = '2026-07-31';
    } else if (datePreset === 'this_year') {
      filterStart = `${year}-01-01`;
      filterEnd = `${year}-12-31`;
    }

    let dateRangeLabel = 'This Month (August 2026)';
    if (datePreset === 'today') dateRangeLabel = 'Today (31 Aug 2026)';
    else if (datePreset === 'this_week') dateRangeLabel = 'This Week (31 Aug – 06 Sep 2026)';
    else if (datePreset === 'last_week') dateRangeLabel = 'Last Week (24 Aug – 30 Aug 2026)';
    else if (datePreset === 'last_month') dateRangeLabel = 'Last Month (July 2026)';
    else if (datePreset === 'this_year') dateRangeLabel = `Full Year ${year}`;
    else if (datePreset === 'custom' && filterStart && filterEnd) {
      dateRangeLabel = `${filterStart} to ${filterEnd}`;
    }

    // Filter requests
    const filtered = this.requests.filter((req) => {
      // Year check
      const reqYear = new Date(req.startDate).getFullYear() || 2026;
      if (year && reqYear !== year && datePreset === 'this_year') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = req.employeeName.toLowerCase().includes(query);
        const matchEmpId = req.employeeCode.toLowerCase().includes(query);
        const matchReqId = req.id.toLowerCase().includes(query);
        const matchDept = req.department.toLowerCase().includes(query);
        const matchType = req.leaveType.toLowerCase().includes(query);
        if (!matchName && !matchEmpId && !matchReqId && !matchDept && !matchType) {
          return false;
        }
      }

      // Employee
      if (employeeId !== 'ALL' && req.employeeId !== employeeId) {
        return false;
      }

      // Department
      if (department !== 'ALL' && req.department !== department) {
        return false;
      }

      // Leave Type
      if (leaveType !== 'ALL' && req.leaveType !== leaveType) {
        return false;
      }

      // Status
      if (status !== 'ALL' && req.status !== status) {
        return false;
      }

      // Date Range (matches if either startDate or endDate overlaps with filter range or falls inside)
      if (filterStart && filterEnd) {
        // Request start or end date overlaps
        const overlaps =
          (req.startDate >= filterStart && req.startDate <= filterEnd) ||
          (req.endDate >= filterStart && req.endDate <= filterEnd) ||
          (req.startDate <= filterStart && req.endDate >= filterEnd);
        if (!overlaps) {
          return false;
        }
      }

      return true;
    });

    // Calculate Summary Stats based on current filtered domain or general period
    const stats: LeaveSummaryStats = {
      totalRequests: this.requests.length,
      pending: this.requests.filter((r) => r.status === 'Pending').length,
      approved: this.requests.filter((r) => r.status === 'Approved').length,
      rejected: this.requests.filter((r) => r.status === 'Rejected').length,
      cancelled: this.requests.filter((r) => r.status === 'Cancelled' || r.status === 'Withdrawn').length,
      employeesOnLeaveToday: this.getCurrentlyOnLeave().length,
      totalDaysApproved: this.requests
        .filter((r) => r.status === 'Approved')
        .reduce((sum, r) => sum + r.totalDays, 0),
      distribution: {
        casual: this.requests.filter((r) => r.leaveType === 'Casual Leave').length,
        annual: this.requests.filter((r) => r.leaveType === 'Annual Leave').length,
        sick: this.requests.filter((r) => r.leaveType === 'Sick Leave').length,
        unpaid: this.requests.filter((r) => r.leaveType === 'Unpaid Leave').length,
        other: this.requests.filter(
          (r) =>
            r.leaveType === 'Special / Other Leave' ||
            r.leaveType === 'Bereavement Leave' ||
            r.leaveType === 'Maternity / Paternity'
        ).length,
      },
    };

    // Sort requests
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'submittedDate') {
        comparison = a.submittedDate.localeCompare(b.submittedDate);
      } else if (sortBy === 'startDate') {
        comparison = a.startDate.localeCompare(b.startDate);
      } else if (sortBy === 'employeeName') {
        comparison = a.employeeName.localeCompare(b.employeeName);
      } else if (sortBy === 'totalDays') {
        comparison = a.totalDays - b.totalDays;
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginatedRequests = filtered.slice(startIndex, startIndex + pageSize);

    return {
      requests: paginatedRequests,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      stats,
      dateRangeLabel,
    };
  }

  public approveLeaveRequest(
    requestId: string,
    hrNotes: string = 'Approved by HR Admin after policy and coverage verification.'
  ): { success: boolean; message: string; updatedRequest?: LeaveRequest } {
    const reqIndex = this.requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, message: `Leave request ${requestId} not found.` };
    }

    const req = this.requests[reqIndex];
    if (req.status !== 'Pending') {
      return { success: false, message: `Request is already ${req.status.toLowerCase()}.` };
    }

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' — ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Update approval steps
    const updatedTimeline = req.timeline.map((step) => {
      if (step.role === 'HR Admin') {
        return {
          ...step,
          action: 'APPROVED' as const,
          timestamp,
          statusLabel: 'Completed' as const,
          notes: hrNotes,
        };
      }
      if (step.role === 'Final Approval') {
        return {
          ...step,
          action: 'APPROVED' as const,
          timestamp,
          statusLabel: 'Completed' as const,
          notes: 'Authorization finalized and recorded to ERP roster.',
        };
      }
      return step;
    });

    const updatedRequest: LeaveRequest = {
      ...req,
      status: 'Approved',
      hrApproverName: 'HR Admin',
      hrApprovalDate: timestamp,
      timeline: updatedTimeline,
    };

    this.requests[reqIndex] = updatedRequest;

    // Deduct from employee balance
    const empBalance = this.getEmployeeBalance(req.employeeId);
    let categoryKey: 'casual' | 'annual' | 'sick' | 'unpaid' | 'other' = 'casual';
    if (req.leaveType === 'Annual Leave') categoryKey = 'annual';
    else if (req.leaveType === 'Sick Leave') categoryKey = 'sick';
    else if (req.leaveType === 'Unpaid Leave') categoryKey = 'unpaid';
    else if (req.leaveType === 'Special / Other Leave' || req.leaveType === 'Bereavement Leave') categoryKey = 'other';

    const cat = empBalance.categories[categoryKey];
    if (cat) {
      cat.used += req.totalDays;
      cat.available = Math.max(0, cat.allocated - cat.used);
      cat.pending = Math.max(0, cat.pending - req.totalDays);
    }

    this.notify();
    return {
      success: true,
      message: `Leave request ${requestId} approved successfully.`,
      updatedRequest,
    };
  }

  public rejectLeaveRequest(
    requestId: string,
    reason: string
  ): { success: boolean; message: string; updatedRequest?: LeaveRequest } {
    if (!reason || !reason.trim()) {
      return { success: false, message: 'Please provide a reason for rejection.' };
    }

    const reqIndex = this.requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { success: false, message: `Leave request ${requestId} not found.` };
    }

    const req = this.requests[reqIndex];
    if (req.status !== 'Pending') {
      return { success: false, message: `Request is already ${req.status.toLowerCase()}.` };
    }

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' — ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Update timeline steps
    const updatedTimeline = req.timeline.map((step) => {
      if (step.role === 'HR Admin') {
        return {
          ...step,
          action: 'REJECTED' as const,
          timestamp,
          statusLabel: 'Rejected' as const,
          notes: `Reason: ${reason.trim()}`,
        };
      }
      if (step.role === 'Final Approval') {
        return {
          ...step,
          action: 'REJECTED' as const,
          timestamp,
          statusLabel: 'Rejected' as const,
          notes: 'Request closed as rejected.',
        };
      }
      return step;
    });

    const updatedRequest: LeaveRequest = {
      ...req,
      status: 'Rejected',
      rejectionReason: reason.trim(),
      hrApproverName: 'HR Admin',
      hrApprovalDate: timestamp,
      timeline: updatedTimeline,
    };

    this.requests[reqIndex] = updatedRequest;

    // Reset pending days in employee balance
    const empBalance = this.getEmployeeBalance(req.employeeId);
    let categoryKey: 'casual' | 'annual' | 'sick' | 'unpaid' | 'other' = 'casual';
    if (req.leaveType === 'Annual Leave') categoryKey = 'annual';
    else if (req.leaveType === 'Sick Leave') categoryKey = 'sick';
    else if (req.leaveType === 'Unpaid Leave') categoryKey = 'unpaid';
    else if (req.leaveType === 'Special / Other Leave' || req.leaveType === 'Bereavement Leave') categoryKey = 'other';

    const cat = empBalance.categories[categoryKey];
    if (cat) {
      cat.pending = Math.max(0, cat.pending - req.totalDays);
    }

    this.notify();
    return {
      success: true,
      message: `Leave request ${requestId} rejected.`,
      updatedRequest,
    };
  }

  public exportLeavesCSV(requests: LeaveRequest[], filename: string = 'alfa_digi_leave_requests.csv'): void {
    const headers = [
      'Request ID',
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Leave Type',
      'Start Date',
      'End Date',
      'Total Days',
      'Submitted Date',
      'Status',
      'Lead Approver',
      'HR Approver',
      'Reason',
      'Rejection Reason',
    ];

    const rows = requests.map((r) => [
      r.id,
      r.employeeCode,
      `"${r.employeeName}"`,
      r.department,
      `"${r.designation}"`,
      `"${r.leaveType}"`,
      r.startDateDisplay,
      r.endDateDisplay,
      r.totalDays,
      r.submittedDate,
      r.status,
      `"${r.leadApproverName || 'N/A'}"`,
      `"${r.hrApproverName || 'N/A'}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${(r.rejectionReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const leaveService = new LeaveService();
