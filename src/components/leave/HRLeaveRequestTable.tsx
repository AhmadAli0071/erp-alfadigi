import React from 'react';
import { LeaveRequest, LeaveRequestStatus } from '../../types/leave';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HRLeaveRequestTableProps {
  requests: LeaveRequest[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewRequest: (request: LeaveRequest) => void;
  onResetFilters: () => void;
}

export const HRLeaveRequestTable: React.FC<HRLeaveRequestTableProps> = ({
  requests,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onViewRequest,
  onResetFilters,
}) => {
  const getStatusBadge = (status: LeaveRequestStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending HR
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'Cancelled':
      case 'Withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200/60 text-slate-500 border border-slate-300">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/60 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getDepartmentBadge = (dept: string) => {
    switch (dept) {
      case 'HR':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Sales':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Tech':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'Casual Leave':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'Annual Leave':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Sick Leave':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Unpaid Leave':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-sky-50 text-sky-600 border-sky-200';
    }
  };

  const startRecordNumber = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecordNumber = Math.min(currentPage * pageSize, totalCount);

  // Skeleton Loader State
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-100/60 rounded-xl w-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-white/75 backdrop-blur-xl border border-slate-200/70 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  // Empty State
  if (requests.length === 0) {
    return (
      <div
        className="p-8 sm:p-12 text-center rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md flex flex-col items-center justify-center min-h-[300px]"
        id="leave-empty-state"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">No leave requests found</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          There are no leave requests matching your current filters or date period.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="leave-requests-container">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 font-medium text-slate-600">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => onViewRequest(req)}
                >
                  {/* Request ID */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                      {req.id}
                    </span>
                  </td>

                  {/* Employee Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/20 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-900 shrink-0 shadow-sm">
                        {req.employeeName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {req.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {req.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${getDepartmentBadge(
                        req.department
                      )}`}
                    >
                      {req.department}
                    </span>
                  </td>

                  {/* Leave Type */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getLeaveTypeBadge(
                        req.leaveType
                      )}`}
                    >
                      {req.leaveType}
                    </span>
                  </td>

                  {/* Dates Range */}
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                      <span>{req.startDateDisplay}</span>
                      <span className="text-slate-400">→</span>
                      <span>{req.endDateDisplay}</span>
                    </div>
                  </td>

                  {/* Total Days */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900">
                      {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                    </span>
                  </td>

                  {/* Submitted Date */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {req.submittedDate}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRequest(req);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/60 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200/80 hover:border-indigo-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      id={`leave-view-btn-${req.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{req.status === 'Pending' ? 'Review' : 'View'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (Clean & No Horizontal Scroll) */}
      <div className="md:hidden space-y-3" id="leave-mobile-cards-list">
        {requests.map((req) => (
          <div
            key={req.id}
            onClick={() => onViewRequest(req)}
            className="p-4 rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer space-y-3 shadow-md"
          >
            {/* Top Row: ID, Dept & Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                  {req.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDepartmentBadge(
                    req.department
                  )}`}
                >
                  {req.department}
                </span>
              </div>
              <div>{getStatusBadge(req.status)}</div>
            </div>

            {/* Employee info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/20 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-900 shrink-0">
                {req.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {req.employeeName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {req.designation} ({req.employeeCode})
                </div>
              </div>
            </div>

            {/* Leave Details Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Leave Type</span>
                <span className="font-semibold text-slate-700 truncate block">
                  {req.leaveType}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Duration</span>
                <span className="font-bold text-slate-900 block">
                  {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div className="col-span-2 text-[11px] text-slate-500">
                <span>{req.startDateDisplay}</span>
                <span className="mx-1.5 text-slate-400">→</span>
                <span>{req.endDateDisplay}</span>
              </div>
            </div>

            {/* Action button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Sub: {req.submittedDate}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRequest(req);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-100/70 text-indigo-600 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{req.status === 'Pending' ? 'Review Request' : 'View Details'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 text-xs text-slate-500"
        id="leave-pagination-bar"
      >
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            Showing <span className="font-bold text-slate-900">{startRecordNumber}</span>–
            <span className="font-bold text-slate-900">{endRecordNumber}</span> of{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> requests
          </div>

          {/* Page Size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] hidden sm:inline">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center justify-center gap-1 self-center sm:self-auto">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            // Only render current, +/- 2 pages, first and last
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return (
                <span key={pageNum} className="text-slate-700 px-0.5">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
