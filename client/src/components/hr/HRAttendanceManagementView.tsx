import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AttendanceRecord,
  Employee,
} from '../../types/hr';
import {
  Search,
  Download,
  Calendar,
  Clock,
  User,
  Users,
  Building,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Moon,
  UserCheck,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { HRAttendanceDetailDrawer } from './HRAttendanceDetailDrawer';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface AttendanceQueryResult {
  records: AttendanceRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  employeeSummary?: {
    employee: Employee | null;
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
  } | null;
  companySummary?: {
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
  } | null;
  dateRangeLabel: string;
}

interface HRAttendanceManagementViewProps {
  onNavigateToDashboard?: () => void;
  initialEmployeeId?: string;
  initialDepartment?: string;
  initialPreset?: string;
}

export const HRAttendanceManagementView: React.FC<HRAttendanceManagementViewProps> = ({
  onNavigateToDashboard,
  initialEmployeeId = 'ALL',
  initialDepartment = 'ALL',
  initialPreset = 'today',
}) => {
  // Filter States
  const [datePreset, setDatePreset] = useState<string>(initialPreset);
  const [customStartDate, setCustomStartDate] = useState<string>(todayISO());
  const [customEndDate, setCustomEndDate] = useState<string>(todayISO());
  const [appliedCustomStart, setAppliedCustomStart] = useState<string>(todayISO());
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<string>(todayISO());

  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmployeeId);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real employees from API
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Query Result State
  const [queryResult, setQueryResult] = useState<AttendanceQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detail Drawer State
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // View Mode for Mobile (Table vs Cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fetch real employees for dropdowns
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/employees`, { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        setEmployees(data.employees || []);
      } catch {
        // ignore
      }
    };
    loadEmployees();
  }, []);

  // Filtered employees list based on department selection
  const availableEmployees = useMemo(() => {
    if (selectedDept === 'ALL') return employees;
    return employees.filter((emp) => emp.department === selectedDept);
  }, [selectedDept, employees]);

  // Handle department change - reset employee if no longer valid
  const handleDepartmentChange = (dept: string) => {
    setSelectedDept(dept);
    if (dept !== 'ALL' && selectedEmployeeId !== 'ALL') {
      const existsInDept = employees.some(
        (emp) => emp.id === selectedEmployeeId && emp.department === dept
      );
      if (!existsInDept) {
        setSelectedEmployeeId('ALL');
      }
    }
    setCurrentPage(1);
  };

  // Handle employee change - optionally sync department
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId !== 'ALL') {
      const emp = employees.find((e) => e.id === empId);
      if (emp && selectedDept !== 'ALL' && emp.department !== selectedDept) {
        setSelectedDept(emp.department);
      }
    }
    setCurrentPage(1);
  };

  // Fetch Attendance Records — REAL API
  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        preset: datePreset,
        department: selectedDept,
        employeeId: selectedEmployeeId,
        status: selectedStatus,
        search: searchQuery.trim(),
        page: String(currentPage),
        pageSize: String(pageSize),
      });
      if (datePreset === 'custom') {
        params.set('startDate', appliedCustomStart);
        params.set('endDate', appliedCustomEnd);
      }

      const res = await fetch(`${API_BASE}/attendance/hr?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const result: AttendanceQueryResult = await res.json();
      setQueryResult(result);
    } catch (err) {
      console.error('Failed to query attendance:', err);
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    datePreset,
    appliedCustomStart,
    appliedCustomEnd,
    selectedEmployeeId,
    selectedDept,
    selectedStatus,
    searchQuery,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Quick Preset Options
  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  // Apply custom date range
  const handleApplyCustomRange = () => {
    if (customEndDate < customStartDate) {
      alert('End Date must be greater than or equal to Start Date.');
      return;
    }
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate);
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setDatePreset('today');
    setSelectedDept('ALL');
    setSelectedEmployeeId('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Export CSV — built from real records
  const handleExportCSV = () => {
    if (!queryResult || queryResult.records.length === 0) return;
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    const empPrefix = emp ? `${emp.name.replace(/\s+/g, '_')}_` : 'All_Employees_';
    const filename = `Attendance_${empPrefix}${datePreset}_${Date.now()}.csv`;

    const headers = ['Date', 'Employee', 'Emp ID', 'Department', 'Clock In', 'Clock Out', 'Break', 'Working', 'Short', 'Extra', 'Status', 'Notes'];
    const rows = queryResult.records.map((r) => [
      r.attendanceDate,
      r.employeeName,
      r.employeeCode,
      r.department,
      r.clockInTime !== '—' ? `${r.clockInTime} (${r.clockInDate})` : '',
      r.clockOutTime !== '—' ? `${r.clockOutTime} (${r.clockOutDate})` : '',
      r.breakDuration,
      r.workingHours,
      r.shortHours,
      r.extraHours,
      r.status,
      r.notes || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setToastMsg(`Exported ${queryResult.totalCount} attendance records to CSV.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Selected Employee object if any
  const selectedEmployeeObj = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (datePreset !== 'today') count++;
    if (selectedDept !== 'ALL') count++;
    if (selectedEmployeeId !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [datePreset, selectedDept, selectedEmployeeId, selectedStatus, searchQuery]);

  // Calculate days selected in custom range
  const customDaysCount = useMemo(() => {
    if (datePreset !== 'custom') return 0;
    const s = new Date(customStartDate);
    const e = new Date(customEndDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return Math.max(1, diff);
  }, [datePreset, customStartDate, customEndDate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="hr-attendance-management-module">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-emerald-200 text-slate-900 text-xs shadow-2xl flex items-center gap-3 animate-scaleUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-slate-700">{toastMsg}</span>
        </div>
      )}

      {/* 1. Page Header (Section 25) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance Management
            </h1>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              Shift: 6 PM – 3 AM
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track employee attendance, working hours, breaks and extra hours.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden px-3 py-2 rounded-xl bg-slate-100/50 border border-slate-200/80 hover:bg-slate-100/70 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer relative"
            id="open-mobile-filters-btn"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!queryResult || queryResult.records.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="export-attendance-btn"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Date Presets Bar (Section 26 & Section 2) */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            Quick Date Filter
          </span>
          <span className="text-xs font-medium text-indigo-600">
            {queryResult?.dateRangeLabel || 'Today'}
          </span>
        </div>

        {/* Scrollable / Wrapping Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar flex-nowrap sm:flex-wrap">
          {presets.map((preset) => {
            const active = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDatePreset(preset.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
                id={`date-preset-${preset.id}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Selector (Section 4) */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">From Date:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                id="custom-start-date-input"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">To Date:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                id="custom-end-date-input"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
              id="apply-custom-date-range-btn"
            >
              Apply
            </button>

            <span className="text-xs text-slate-500 italic">
              ({customDaysCount} {customDaysCount === 1 ? 'day' : 'days'} selected)
            </span>
          </div>
        )}
      </div>

      {/* 3. Advanced Filtering Toolbar (Desktop) */}
      <div className="hidden md:flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        {/* Search Query */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee name, ID, or dept..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs py-2 pl-8 pr-7 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            id="attendance-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Selector */}
        <div className="w-44">
          <select
            value={selectedDept}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="attendance-department-select"
          >
            <option value="ALL" className="bg-white/80 backdrop-blur-xl">All Departments</option>
            <option value="HR" className="bg-white/80 backdrop-blur-xl">HR</option>
            <option value="Sales" className="bg-white/80 backdrop-blur-xl">Sales</option>
            <option value="Tech" className="bg-white/80 backdrop-blur-xl">Tech</option>
          </select>
        </div>

        {/* Employee Selector (dynamically filtered by Department) */}
        <div className="w-56">
          <select
            value={selectedEmployeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="attendance-employee-select"
          >
            <option value="ALL" className="bg-white/80 backdrop-blur-xl">
              {selectedDept !== 'ALL' ? `All ${selectedDept} Employees` : 'All Employees'}
            </option>
            {availableEmployees.map((emp) => (
              <option key={emp.id} value={emp.id} className="bg-white/80 backdrop-blur-xl">
                {emp.name} ({emp.empId})
              </option>
            ))}
          </select>
        </div>

        {/* Attendance Status Selector */}
        <div className="w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs py-2 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="attendance-status-select"
          >
            <option value="ALL" className="bg-white/80 backdrop-blur-xl">All Statuses</option>
            <option value="Present" className="bg-white/80 backdrop-blur-xl">Present</option>
            <option value="Absent" className="bg-white/80 backdrop-blur-xl">Absent</option>
            <option value="Late" className="bg-white/80 backdrop-blur-xl">Late / Short Hours</option>
            <option value="Half Day" className="bg-white/80 backdrop-blur-xl">Half Day</option>
            <option value="Leave" className="bg-white/80 backdrop-blur-xl">Leave</option>
            <option value="Work From Home" className="bg-white/80 backdrop-blur-xl">Work From Home</option>
            <option value="On Duty" className="bg-white/80 backdrop-blur-xl">On Duty</option>
            <option value="Holiday" className="bg-white/80 backdrop-blur-xl">Holiday</option>
            <option value="Weekend" className="bg-white/80 backdrop-blur-xl">Weekend</option>
          </select>
        </div>

        {/* Reset Filters */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="p-2 rounded-xl bg-slate-100/50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer"
            title="Reset all filters"
            id="reset-attendance-filters-btn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. Active Filters Summary Bar & Removable Chips (Section 8) */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900">Results for:</span>

          {/* Period Chip */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 font-medium">
            <Calendar className="w-3 h-3 text-indigo-600" />
            <span>{queryResult?.dateRangeLabel || 'Today'}</span>
          </span>

          {/* Employee Chip */}
          {selectedEmployeeObj ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 font-medium">
              <User className="w-3 h-3 text-indigo-600" />
              <span>{selectedEmployeeObj.name}</span>
              <button
                type="button"
                onClick={() => setSelectedEmployeeId('ALL')}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-600 font-medium">
              <Users className="w-3 h-3 text-slate-500" />
              <span>All Employees</span>
            </span>
          )}

          {/* Department Chip */}
          {selectedDept !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-600 font-medium">
              <Building className="w-3 h-3 text-slate-500" />
              <span>{selectedDept}</span>
              <button
                type="button"
                onClick={() => handleDepartmentChange('ALL')}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Status Chip */}
          {selectedStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-600 font-medium">
              <span>Status: {selectedStatus}</span>
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Search Query Chip */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/60 border border-slate-200/80 text-slate-600 font-medium">
              <span>Query: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs font-bold text-slate-500">
            {queryResult?.totalCount || 0} records found
          </span>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-indigo-600 hover:text-indigo-600 font-semibold cursor-pointer underline text-[11px]"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* 5. Attendance Summary Cards (Section 10) */}
      {selectedEmployeeObj && queryResult?.employeeSummary ? (
        /* Employee-Specific Summary Card */
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-600 font-black flex items-center justify-center text-sm shrink-0">
                {selectedEmployeeObj.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {selectedEmployeeObj.name} — Attendance Summary
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedEmployeeObj.empId} • {selectedEmployeeObj.jobTitle} (
                  <span className="text-slate-600 font-semibold">{selectedEmployeeObj.department}</span>)
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 self-start sm:self-auto">
              {queryResult.employeeSummary.periodLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Working Days</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                {queryResult.employeeSummary.workingDays}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-200">
              <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Present</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.presentDays}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/[0.04] border border-rose-200">
              <span className="text-[10px] text-rose-600 block font-semibold uppercase">Absent</span>
              <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.absentDays}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/[0.04] border border-blue-200">
              <span className="text-[10px] text-blue-600 block font-semibold uppercase">Leaves</span>
              <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.leaveDays}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Avg Work/Day</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {queryResult.employeeSummary.avgWorkingHours}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/[0.04] border border-orange-200">
              <span className="text-[10px] text-orange-600 block font-semibold uppercase">Short Hours</span>
              <span className="text-base font-bold text-orange-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.totalShortHours}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-200">
              <span className="text-[10px] text-indigo-600 block font-semibold uppercase">Approved OT</span>
              <span className="text-base font-bold text-indigo-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.approvedExtraHours}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-200">
              <span className="text-[10px] text-amber-600 block font-semibold uppercase">Pending OT</span>
              <span className="text-base font-bold text-amber-600 font-mono mt-0.5 block">
                {queryResult.employeeSummary.pendingExtraHours}
              </span>
            </div>
          </div>
        </div>
      ) : queryResult?.companySummary ? (
        /* All Employees Summary Card */
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Company-wide Attendance Summary
              </h3>
              <p className="text-xs text-slate-500">
                Turnout overview across HR, Sales, and Tech departments
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 self-start sm:self-auto">
              {queryResult.companySummary.periodLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Records</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                {queryResult.companySummary.totalRecords}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-200">
              <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Present</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                {queryResult.companySummary.presentCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/[0.04] border border-rose-200">
              <span className="text-[10px] text-rose-600 block font-semibold uppercase">Absent</span>
              <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
                {queryResult.companySummary.absentCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/[0.04] border border-blue-200">
              <span className="text-[10px] text-blue-600 block font-semibold uppercase">On Leave</span>
              <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
                {queryResult.companySummary.leaveCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/[0.04] border border-sky-200">
              <span className="text-[10px] text-sky-600 block font-semibold uppercase">WFH</span>
              <span className="text-lg font-black text-sky-600 font-mono mt-0.5 block">
                {queryResult.companySummary.wfhCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/[0.04] border border-purple-200">
              <span className="text-[10px] text-purple-600 block font-semibold uppercase">Half Day</span>
              <span className="text-lg font-black text-purple-600 font-mono mt-0.5 block">
                {queryResult.companySummary.halfDayCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Avg Net Work</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {queryResult.companySummary.avgWorkingHours}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-200">
              <span className="text-[10px] text-indigo-600 block font-semibold uppercase">Approved OT</span>
              <span className="text-base font-bold text-indigo-600 font-mono mt-0.5 block">
                {queryResult.companySummary.totalApprovedExtraHours}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 6. Overnight Shift Clarification Banner (Section 15) */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
        <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong className="text-slate-600">Shift Crossover Note:</strong> Shift start date represents the attendance day. Punches after midnight display the next calendar date with night badges.
        </span>
      </div>

      {/* 7. Attendance Table Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls Top */}
        <div className="p-4 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Attendance Records
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500">
              ({queryResult?.totalCount || 0} total)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle for Small Screens */}
            <div className="sm:hidden flex items-center bg-slate-100/50 rounded-lg p-0.5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                title="Table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                title="Card view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page size dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-lg bg-slate-100/50 border border-slate-200/80 text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={20} className="bg-white/80 backdrop-blur-xl">20</option>
                <option value={50} className="bg-white/80 backdrop-blur-xl">50</option>
                <option value={100} className="bg-white/80 backdrop-blur-xl">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Table View */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] select-none">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Clock In</th>
                  <th className="py-3 px-3">Clock Out</th>
                  <th className="py-3 px-3">Break</th>
                  <th className="py-3 px-3">Working</th>
                  <th className="py-3 px-3">Short</th>
                  <th className="py-3 px-3">Extra</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/70 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : queryResult && queryResult.records.length > 0 ? (
                  queryResult.records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{record.attendanceDate}</span>
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {record.employeeName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                              {record.employeeName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {record.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-100/60 text-slate-600 border-slate-200/80">
                          {record.department}
                        </span>
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {record.clockInTime !== '—' ? (
                          <div>
                            <span className="text-slate-700">{record.clockInTime}</span>
                            <span className="text-[9px] text-slate-400 ml-1">
                              ({record.clockInDate})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700">—</span>
                        )}
                      </td>

                      {/* Clock Out (with overnight date marker) */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {record.clockOutTime !== '—' ? (
                          <div>
                            <span className="text-slate-700">{record.clockOutTime}</span>
                            <span className="text-[9px] font-semibold text-indigo-600 ml-1">
                              ({record.clockOutDate})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700">—</span>
                        )}
                      </td>

                      {/* Break */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {record.breakDuration}
                      </td>

                      {/* Working Hours */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={`font-bold ${
                            record.workingHours >= '08:00' ? 'text-emerald-600' : 'text-slate-600'
                          }`}
                        >
                          {record.workingHours}
                        </span>
                      </td>

                      {/* Short Hours */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {record.shortHours !== '00:00' ? (
                          <span className="text-orange-600 font-semibold">{record.shortHours}</span>
                        ) : (
                          <span className="text-slate-700">00:00</span>
                        )}
                      </td>

                      {/* Extra Hours */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {record.extraHours !== '00:00' ? (
                          <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            +{record.extraHours}
                          </span>
                        ) : (
                          <span className="text-slate-700">00:00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={record.status} size="xs" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordForDetail(record);
                            setIsDrawerOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100/50 hover:bg-indigo-600 hover:text-white text-slate-600 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      No attendance records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile Card View */
          <div className="p-4 space-y-3 divide-y divide-slate-200/70">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading attendance records...
              </div>
            ) : queryResult && queryResult.records.length > 0 ? (
              queryResult.records.map((record) => (
                <div key={record.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{record.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {record.employeeCode} • {record.department}
                      </div>
                    </div>
                    <StatusBadge status={record.status} size="xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Date & Shift</span>
                      <span className="font-semibold text-slate-700">{record.attendanceDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Work</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {record.workingHours}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">In / Out</span>
                      <span className="font-mono text-slate-600">
                        {record.clockInTime} – {record.clockOutTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Extra Time</span>
                      <span className="font-mono text-amber-600">{record.extraHours}</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecordForDetail(record);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100/50 text-indigo-600 font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Shift Details</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records found.
              </div>
            )}
          </div>
        )}

        {/* 8. Pagination Controls (Section 23) */}
        {queryResult && queryResult.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <strong className="text-slate-900">
                {(queryResult.page - 1) * queryResult.pageSize + 1}–
                {Math.min(queryResult.page * queryResult.pageSize, queryResult.totalCount)}
              </strong>{' '}
              of <strong className="text-slate-900">{queryResult.totalCount}</strong> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={queryResult.page <= 1}
                className="px-3 py-1.5 rounded-lg bg-slate-100/50 hover:bg-slate-100/70 disabled:opacity-30 disabled:pointer-events-none text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                id="pagination-prev-btn"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, queryResult.totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  const active = queryResult.page === pNum;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(queryResult.totalPages, p + 1))}
                disabled={queryResult.page >= queryResult.totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-100/50 hover:bg-slate-100/70 disabled:opacity-30 disabled:pointer-events-none text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                id="pagination-next-btn"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Attendance Detail Slide-over Drawer (Section 17) */}
      <HRAttendanceDetailDrawer
        record={selectedRecordForDetail}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRecordForDetail(null);
        }}
      />

      {/* 10. Mobile Filter Drawer / Bottom Sheet */}
      {isMobileFilterOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl border-t sm:border border-slate-200/80 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 z-10 animate-slideUp text-slate-700 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Filter Attendance</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Search</label>
              <input
                type="text"
                placeholder="Search name, code, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Mobile Department */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none"
              >
                <option value="ALL" className="bg-white/80 backdrop-blur-xl">All Departments</option>
                <option value="HR" className="bg-white/80 backdrop-blur-xl">HR</option>
                <option value="Sales" className="bg-white/80 backdrop-blur-xl">Sales</option>
                <option value="Tech" className="bg-white/80 backdrop-blur-xl">Tech</option>
              </select>
            </div>

            {/* Mobile Employee */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none"
              >
                <option value="ALL" className="bg-white/80 backdrop-blur-xl">
                  {selectedDept !== 'ALL' ? `All ${selectedDept} Staff` : 'All Staff'}
                </option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-white/80 backdrop-blur-xl">
                    {emp.name} ({emp.empId})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Status */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-700 focus:outline-none"
              >
                <option value="ALL" className="bg-white/80 backdrop-blur-xl">All Statuses</option>
                <option value="Present" className="bg-white/80 backdrop-blur-xl">Present</option>
                <option value="Absent" className="bg-white/80 backdrop-blur-xl">Absent</option>
                <option value="Late" className="bg-white/80 backdrop-blur-xl">Late / Short Hours</option>
                <option value="Half Day" className="bg-white/80 backdrop-blur-xl">Half Day</option>
                <option value="Leave" className="bg-white/80 backdrop-blur-xl">Leave</option>
                <option value="Work From Home" className="bg-white/80 backdrop-blur-xl">Work From Home</option>
              </select>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex-1 py-2.5 rounded-xl bg-slate-100/60 hover:bg-slate-200/60 text-slate-600 text-xs font-semibold"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
