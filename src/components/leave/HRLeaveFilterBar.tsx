import React, { useState } from 'react';
import { LeaveFilterParams } from '../../types/leave';
import { MOCK_EMPLOYEES } from '../../mock/hrData';
import { MOCK_LEAVE_TYPES } from '../../mock/leaveData';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Calendar,
  Layers,
  Users,
  CheckCircle,
} from 'lucide-react';

interface HRLeaveFilterBarProps {
  filters: LeaveFilterParams;
  onFilterChange: (newFilters: Partial<LeaveFilterParams>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const HRLeaveFilterBar: React.FC<HRLeaveFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.searchQuery || '');
  const [localCustomStart, setLocalCustomStart] = useState(filters.startDate || '2026-08-01');
  const [localCustomEnd, setLocalCustomEnd] = useState(filters.endDate || '2026-08-31');

  const datePresets = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const years = [2025, 2026, 2027];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ searchQuery: localSearch, page: 1 });
  };

  const handleApplyCustomDate = () => {
    onFilterChange({
      datePreset: 'custom',
      startDate: localCustomStart,
      endDate: localCustomEnd,
      page: 1,
    });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.employeeId !== 'ALL' ||
    filters.department !== 'ALL' ||
    filters.leaveType !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.datePreset !== 'this_month' ||
    filters.year !== 2026;

  // Filter components reusable between desktop and mobile bottom-sheet
  const filterControls = (
    <div className="space-y-4 text-xs">
      {/* Search Field */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onFilterChange({ searchQuery: e.target.value, page: 1 });
            }}
            placeholder="Search employee or leave request (e.g. name, ID)..."
            className="w-full bg-[#111217] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            id="leave-filter-search-input"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ searchQuery: '', page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Employee Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-indigo-400" />
            Employee
          </label>
          <select
            value={filters.employeeId || 'ALL'}
            onChange={(e) => onFilterChange({ employeeId: e.target.value, page: 1 })}
            className="w-full bg-[#111217] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="leave-filter-employee-select"
          >
            <option value="ALL">All Employees</option>
            {MOCK_EMPLOYEES.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.empId} — {emp.department})
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-indigo-400" />
            Department
          </label>
          <select
            value={filters.department || 'ALL'}
            onChange={(e) => onFilterChange({ department: e.target.value, page: 1 })}
            className="w-full bg-[#111217] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="leave-filter-department-select"
          >
            <option value="ALL">All Departments</option>
            <option value="HR">HR Department</option>
            <option value="Sales">Sales Department</option>
            <option value="Tech">Tech Department</option>
          </select>
        </div>

        {/* Leave Type Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-indigo-400" />
            Leave Type
          </label>
          <select
            value={filters.leaveType || 'ALL'}
            onChange={(e) => onFilterChange({ leaveType: e.target.value, page: 1 })}
            className="w-full bg-[#111217] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="leave-filter-type-select"
          >
            <option value="ALL">All Leave Types</option>
            {MOCK_LEAVE_TYPES.map((lt) => (
              <option key={lt.id} value={lt.name}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-indigo-400" />
            Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="w-full bg-[#111217] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="leave-filter-status-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending HR Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Date Period Presets & Year Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-white/5">
        {/* Period Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">
            Period:
          </span>
          {datePresets.map((preset) => {
            const active = filters.datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onFilterChange({ datePreset: preset.id as any, page: 1 })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
                id={`leave-preset-${preset.id}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Year Filter & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-[#111217] border border-white/10 rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-slate-400">Year:</span>
            <select
              value={filters.year || 2026}
              onChange={(e) => onFilterChange({ year: Number(e.target.value), page: 1 })}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              id="leave-filter-year-select"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#111217] text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onResetFilters();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 transition-colors text-xs font-semibold cursor-pointer"
              id="leave-filter-clear-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker Accordion */}
      {filters.datePreset === 'custom' && (
        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex flex-wrap items-center gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 font-medium">From:</label>
            <input
              type="date"
              value={localCustomStart}
              onChange={(e) => setLocalCustomStart(e.target.value)}
              className="bg-[#111217] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 font-medium">To:</label>
            <input
              type="date"
              value={localCustomEnd}
              onChange={(e) => setLocalCustomEnd(e.target.value)}
              className="bg-[#111217] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyCustomDate}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Apply Range
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full" id="leave-management-filter-bar">
      {/* Desktop & Tablet Filter Card */}
      <div className="hidden sm:block p-4 sm:p-5 rounded-2xl bg-[#0d0e12] border border-white/5 shadow-md">
        {filterControls}
      </div>

      {/* Mobile Bar: Search + Filter Toggle Button */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onFilterChange({ searchQuery: e.target.value, page: 1 });
              }}
              placeholder="Search employee or leave ID..."
              className="w-full bg-[#0d0e12] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              hasActiveFilters
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-[#0d0e12] border-white/10 text-slate-300 hover:bg-white/5'
            }`}
            id="mobile-filters-drawer-trigger"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Mobile quick period bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {datePresets.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onFilterChange({ datePreset: preset.id as any, page: 1 })}
              className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap cursor-pointer ${
                filters.datePreset === preset.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-[#111217] text-slate-400 border border-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet Drawer */}
      {isMobileFilterOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full max-h-[85vh] overflow-y-auto bg-[#0d0e12] border-t border-white/10 rounded-t-3xl p-5 shadow-2xl z-10 animate-slideUp custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Filter Leave Requests</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {filterControls}

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    onResetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                Apply Filters ({totalResultsCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
