import React, { useState } from 'react';
import {
  TicketFilterParams,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '../../types/ticket';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  Filter,
} from 'lucide-react';

interface HRTicketFilterBarProps {
  filters: TicketFilterParams;
  onFilterChange: (newFilters: Partial<TicketFilterParams>) => void;
  onReset: () => void;
  totalFilteredCount: number;
}

export const HRTicketFilterBar: React.FC<HRTicketFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalFilteredCount,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.searchQuery || '');

  const statuses: (TicketStatus | 'ALL')[] = [
    'ALL',
    'Open',
    'Pending',
    'In Progress',
    'Resolved',
    'Closed',
    'Rejected',
  ];

  const priorities: (TicketPriority | 'ALL')[] = ['ALL', 'Low', 'Medium', 'High', 'Urgent'];

  const departments = ['ALL', 'HR', 'Sales', 'Tech'];

  const ticketTypes: (TicketType | 'ALL')[] = [
    'ALL',
    'General HR',
    'Attendance Correction',
    'Leave Inquiry',
    'Payroll & Salary',
    'Hardware / IT',
    'Workplace / Facility',
    'Policy & Grievance',
    'Other',
  ];

  const datePresets = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const hasActiveFilters =
    (filters.status && filters.status !== 'ALL') ||
    (filters.priority && filters.priority !== 'ALL') ||
    (filters.department && filters.department !== 'ALL') ||
    (filters.ticketType && filters.ticketType !== 'ALL') ||
    (filters.datePreset && filters.datePreset !== 'all') ||
    (filters.searchQuery && filters.searchQuery.trim().length > 0);

  const filterControls = (
    <>
      {/* Status Selector */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[11px] font-medium text-slate-500">Status</label>
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="ticket-filter-status"
        >
          {statuses.map((st) => (
            <option key={st} value={st} className="bg-slate-100 text-slate-700">
              {st === 'ALL' ? 'All Statuses' : st}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Selector */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-[11px] font-medium text-slate-500">Priority</label>
        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onFilterChange({ priority: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="ticket-filter-priority"
        >
          {priorities.map((pr) => (
            <option key={pr} value={pr} className="bg-slate-100 text-slate-700">
              {pr === 'ALL' ? 'All Priorities' : pr}
            </option>
          ))}
        </select>
      </div>

      {/* Department Selector */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-[11px] font-medium text-slate-500">Department</label>
        <select
          value={filters.department || 'ALL'}
          onChange={(e) => onFilterChange({ department: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="ticket-filter-department"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept} className="bg-slate-100 text-slate-700">
              {dept === 'ALL' ? 'All Departments' : dept}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket Type Selector */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-[11px] font-medium text-slate-500">Ticket Type</label>
        <select
          value={filters.ticketType || 'ALL'}
          onChange={(e) => onFilterChange({ ticketType: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="ticket-filter-type"
        >
          {ticketTypes.map((tt) => (
            <option key={tt} value={tt} className="bg-slate-100 text-slate-700">
              {tt === 'ALL' ? 'All Types' : tt}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-[11px] font-medium text-slate-500">Date Range</label>
        <select
          value={filters.datePreset || 'all'}
          onChange={(e) => onFilterChange({ datePreset: e.target.value, page: 1 })}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="ticket-filter-date-preset"
        >
          {datePresets.map((dp) => (
            <option key={dp.value} value={dp.value} className="bg-slate-100 text-slate-700">
              {dp.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Date Range inputs if custom selected */}
      {filters.datePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">Start</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              id="ticket-filter-start-date"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">End</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              id="ticket-filter-end-date"
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 space-y-3" id="hr-ticket-filter-bar">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onFilterChange({ searchQuery: e.target.value, page: 1 });
            }}
            placeholder="Search tickets (ID, employee, subject, department)..."
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            id="ticket-filter-search-input"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ searchQuery: '', page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle & Quick Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100/60 border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
            id="ticket-mobile-filter-btn"
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onReset();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer"
              title="Reset all filters"
              id="ticket-filter-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Horizontal Filter Bar */}
      <div className="hidden md:flex flex-wrap items-end gap-3 pt-2 border-t border-slate-200/70">
        {filterControls}
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/25 backdrop-blur-[3px]">
          <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/80 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Filter Tickets</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">{filterControls}</div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onReset();
                  setIsMobileDrawerOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600 hover:bg-slate-100/60 text-center"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 text-center"
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
