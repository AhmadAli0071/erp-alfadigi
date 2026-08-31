import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LeaveFilterParams,
  LeaveQueryResult,
  LeaveRequest,
} from '../../types/leave';
import { leaveService } from '../../services/leaveService';
import { HRLeaveSummaryCards } from './HRLeaveSummaryCards';
import { HRLeaveFilterBar } from './HRLeaveFilterBar';
import { HRLeaveRequestTable } from './HRLeaveRequestTable';
import { HRLeaveRequestDetailDrawer } from './HRLeaveRequestDetailDrawer';
import { HRLeaveApproveModal } from './HRLeaveApproveModal';
import { HRLeaveRejectModal } from './HRLeaveRejectModal';
import { HRLeaveCalendarView } from './HRLeaveCalendarView';
import { HRCurrentlyOnLeaveCard } from './HRCurrentlyOnLeaveCard';
import { HRUpcomingLeavesCard } from './HRUpcomingLeavesCard';
import { HRLeaveDistributionCard } from './HRLeaveDistributionCard';
import { HRLeaveTypesModal } from './HRLeaveTypesModal';
import {
  CalendarDays,
  ListFilter,
  Download,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface HRLeaveManagementViewProps {
  onNavigateToDashboard?: () => void;
  initialPreset?: 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
}

export const HRLeaveManagementView: React.FC<HRLeaveManagementViewProps> = ({
  onNavigateToDashboard,
  initialPreset = 'this_month',
}) => {
  // Main view mode: 'list' vs 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter state
  const [filters, setFilters] = useState<LeaveFilterParams>({
    searchQuery: '',
    employeeId: 'ALL',
    department: 'ALL',
    leaveType: 'ALL',
    status: 'ALL',
    datePreset: initialPreset,
    year: 2026,
    page: 1,
    pageSize: 20,
    sortBy: 'submittedDate',
    sortDirection: 'desc',
  });

  // Query Result State
  const [queryResult, setQueryResult] = useState<LeaveQueryResult>(() =>
    leaveService.getLeaveRequests(filters)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Selected request for detail drawer
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Modals state
  const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    id: string;
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ id: Date.now().toString(), text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Fetch / Query data
  const fetchData = useCallback(() => {
    try {
      setHasError(false);
      const res = leaveService.getLeaveRequests(filters);
      setQueryResult(res);
    } catch (err) {
      console.error('Error loading leave requests:', err);
      setHasError(true);
    }
  }, [filters]);

  // Subscribe to service updates (e.g. on approve/reject)
  useEffect(() => {
    fetchData();
    const unsubscribe = leaveService.subscribe(() => {
      fetchData();
      // If a request is currently open, refresh it in drawer
      if (selectedRequest) {
        const refreshed = leaveService.getLeaveRequestById(selectedRequest.id);
        if (refreshed) {
          setSelectedRequest(refreshed);
        }
      }
    });
    return () => unsubscribe();
  }, [fetchData, selectedRequest]);

  // Filter mutation helper
  const handleFilterChange = (newFilters: Partial<LeaveFilterParams>) => {
    setIsLoading(true);
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setTimeout(() => {
      setIsLoading(false);
    }, 150);
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setFilters({
      searchQuery: '',
      employeeId: 'ALL',
      department: 'ALL',
      leaveType: 'ALL',
      status: 'ALL',
      datePreset: 'this_month',
      year: 2026,
      page: 1,
      pageSize: 20,
      sortBy: 'submittedDate',
      sortDirection: 'desc',
    });
    setTimeout(() => {
      setIsLoading(false);
    }, 150);
  };

  // Card click status filter toggle
  const handleSelectStatusCard = (statusKey: string) => {
    handleFilterChange({
      status: statusKey,
      page: 1,
    });
  };

  // Drawer handlers
  const handleOpenDetail = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDrawerOpen(false);
    setSelectedRequest(null);
  };

  // Modal handlers
  const handleOpenApproveModal = (req: LeaveRequest) => {
    setApprovingRequest(req);
  };

  const handleOpenRejectModal = (req: LeaveRequest) => {
    setRejectingRequest(req);
  };

  // Export CSV
  const handleExportCSV = () => {
    leaveService.exportLeavesCSV(queryResult.requests, `AlfaDigi_Leaves_${filters.datePreset}_2026.csv`);
    showToast('Leave records exported to CSV successfully.', 'info');
  };

  // Side widget data
  const currentlyOnLeaveList = useMemo(() => leaveService.getCurrentlyOnLeave(), []);
  const upcomingLeavesList = useMemo(() => leaveService.getUpcomingLeaves('2026-08-31', 5), []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12" id="hr-leave-management-screen">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-slideDown">
          <div
            className={`p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40 shadow-indigo-950/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="truncate">{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Leave Management</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {queryResult.dateRangeLabel}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review, track and manage employee leave requests.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Calendar View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-[#0d0e12] border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
            id="leave-view-mode-toggle"
          >
            {viewMode === 'list' ? (
              <>
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                <span>Calendar View</span>
              </>
            ) : (
              <>
                <ListFilter className="w-4 h-4 text-white" />
                <span>Table View</span>
              </>
            )}
          </button>

          {/* Leave Types Policy Button */}
          <button
            type="button"
            onClick={() => setIsTypesModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d0e12] border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            id="leave-types-modal-trigger"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Leave Types</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d0e12] border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="Export filtered records to CSV"
            id="leave-export-csv-btn"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Cards (Exactly 5 Cards) */}
      <HRLeaveSummaryCards
        stats={queryResult.stats}
        currentStatusFilter={filters.status || 'ALL'}
        onSelectStatusFilter={handleSelectStatusCard}
      />

      {/* 3. Filter Bar */}
      <HRLeaveFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={queryResult.totalCount}
      />

      {/* Error Fallback State */}
      {hasError ? (
        <div
          className="p-8 sm:p-12 text-center rounded-2xl bg-[#0d0e12] border border-rose-500/30 text-xs shadow-md"
          id="leave-error-state"
        >
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">Unable to load leave requests.</h3>
          <p className="text-slate-400 mb-4">
            An unexpected error occurred while retrieving leave records.
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : viewMode === 'calendar' ? (
        /* 4. Calendar View */
        <HRLeaveCalendarView
          requests={queryResult.requests}
          onViewRequest={handleOpenDetail}
          year={filters.year || 2026}
        />
      ) : (
        /* 5. List View & Analytics Cards */
        <div className="space-y-6">
          {/* Main Table / Mobile Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Leave Requests</span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {queryResult.totalCount}
                </span>
              </h2>

              {filters.status !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleFilterChange({ status: 'ALL', page: 1 })}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Filtering: <strong>{filters.status}</strong></span>
                  <X className="w-3 h-3 text-rose-400" />
                </button>
              )}
            </div>

            <HRLeaveRequestTable
              requests={queryResult.requests}
              totalCount={queryResult.totalCount}
              currentPage={queryResult.page}
              pageSize={queryResult.pageSize}
              totalPages={queryResult.totalPages}
              isLoading={isLoading}
              onPageChange={(page) => handleFilterChange({ page })}
              onPageSizeChange={(pageSize) => handleFilterChange({ pageSize, page: 1 })}
              onViewRequest={handleOpenDetail}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Secondary 3-Card Grid (Currently On Leave, Upcoming Leaves, Leave Distribution) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <HRCurrentlyOnLeaveCard
              leaves={currentlyOnLeaveList}
              onViewRequest={handleOpenDetail}
              onViewAllOnLeave={() => {
                handleFilterChange({ status: 'Approved', page: 1 });
              }}
            />

            <HRUpcomingLeavesCard
              upcomingLeaves={upcomingLeavesList}
              onViewRequest={handleOpenDetail}
              onViewCalendar={() => setViewMode('calendar')}
            />

            <HRLeaveDistributionCard
              distribution={queryResult.stats.distribution}
              totalApprovedDays={queryResult.stats.totalDaysApproved}
            />
          </div>
        </div>
      )}

      {/* 6. Leave Request Detail Slide-over Drawer */}
      <HRLeaveRequestDetailDrawer
        request={selectedRequest}
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDetail}
        onOpenApproveModal={handleOpenApproveModal}
        onOpenRejectModal={handleOpenRejectModal}
      />

      {/* 7. Approve Confirmation Modal */}
      <HRLeaveApproveModal
        request={approvingRequest}
        isOpen={Boolean(approvingRequest)}
        onClose={() => setApprovingRequest(null)}
        onSuccess={(msg) => {
          showToast(msg, 'success');
        }}
      />

      {/* 8. Reject Reason Modal */}
      <HRLeaveRejectModal
        request={rejectingRequest}
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        onSuccess={(msg) => {
          showToast(msg, 'info');
        }}
      />

      {/* 9. Leave Types Policy Modal */}
      <HRLeaveTypesModal
        isOpen={isTypesModalOpen}
        onClose={() => setIsTypesModalOpen(false)}
      />
    </div>
  );
};
