import React, { useState } from 'react';
import { ReportCategory, ReportFilterParams } from '../../types/report';
import {
  Calendar,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
  Search,
} from 'lucide-react';

interface HRReportFilterBarProps {
  category: ReportCategory;
  filters: ReportFilterParams;
  onFilterChange: (newFilters: Partial<ReportFilterParams>) => void;
  onReset: () => void;
}

export const HRReportFilterBar: React.FC<HRReportFilterBarProps> = ({
  category,
  filters,
  onFilterChange,
  onReset,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const departments强 = ['ALL', 'HR', 'Sales', 'Tech'];

  const leaveTypes强 = [
    'ALL',
    'Casual Leave',
    'Annual Leave',
    'Sick Leave',
    'Unpaid Leave',
    'Special / Other Leave',
  ];

  const statuses强 = ['ALL', 'Present', 'Absent', 'Leave', 'Work From Home', 'Half Day'];

  const filterElements = (
    <>
      {/* Date Preset */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[11px] font-medium text-slate-500">Date Range</label>
        <select
          value={filters.datePreset || 'this_month'}
          onChange={(e) => onFilterChange({ datePreset: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="report-filter-date-preset"
        >
          {datePresets.map((dp) => (
            <option key={dp.value} value={dp.value} className="bg-slate-100 text-slate-700">
              {dp.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Date Range if active */}
      {filters.datePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Department filter */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-[11px] font-medium text-slate-500">Department</label>
        <select
          value={filters.department || 'ALL'}
          onChange={(e) => onFilterChange({ department: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          id="report-filter-department"
        >
          {departments强.map((d) => (
            <option key={d} value={d} className="bg-slate-100 text-slate-700">
              {d === 'ALL' ? 'All Departments' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Leave Type filter (if leave report) */}
      {category === 'leave' && (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[11px] font-medium text-slate-500">Leave Type</label>
          <select
            value={filters.leaveType || 'ALL'}
            onChange={(e) => onFilterChange({ leaveType: e.target.value, page: 1 })}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            id="report-filter-leave-type"
          >
            {leaveTypes强.map((lt) => (
              <option key={lt} value={lt} className="bg-slate-100 text-slate-700">
                {lt === 'ALL' ? 'All Types' : lt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status filter (if attendance or overtime report) */}
      {(category === 'attendance' || category === 'overtime') && (
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-500">Status</label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            id="report-filter-status"
          >
            {statuses强.map((st) => (
              <option key={st} value={st} className="bg-slate-100 text-slate-700">
                {st === 'ALL' ? 'All Statuses' : st}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );

  return (
    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 space-y-3" id="hr-report-filter-bar">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-900">Report Parameters</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/60 border border-slate-200/80 text-xs font-medium text-slate-600"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Desktop Horizontal Filter Bar */}
      <div className="hidden md:flex flex-wrap items-end gap-3 pt-2 border-t border-slate-200/70">
        {filterElements}
      </div>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/25 backdrop-blur-[3px]">
          <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/80 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Report Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">{filterElements}</div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsMobileDrawerOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600 text-center"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white text-center shadow-lg shadow-indigo-600/30"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
