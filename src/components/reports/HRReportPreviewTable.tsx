import React from 'react';
import {
  AttendanceReportRow,
  DepartmentReportRow,
  EmployeeReportRow,
  HRActivityReportRow,
  LeaveReportRow,
  OvertimeReportRow,
  ReportCategory,
  ReportRow,
} from '../../types/report';
import {
  BarChart3,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

interface HRReportPreviewTableProps {
  category: ReportCategory;
  records: ReportRow[];
  isLoading: boolean;
  error: string | null;
  dateRangeLabel: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onOpenExportModal: () => void;
}

export const HRReportPreviewTable: React.FC<HRReportPreviewTableProps> = ({
  category,
  records,
  isLoading,
  error,
  dateRangeLabel,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onRetry,
  onOpenExportModal,
}) => {
  const getCategoryTitle = () => {
    switch (category) {
      case 'attendance':
        return 'Attendance Report';
      case 'leave':
        return 'Leave Report';
      case 'overtime':
        return 'Overtime & Extra Hours Report';
      case 'employee':
        return 'Employee Roster Report';
      case 'department':
        return 'Department Summary Report';
      case 'activity':
        return 'HR Activity Audit Report';
    }
  };

  const renderTableHeader = () => {
    switch (category) {
      case 'attendance':
        return (
          <tr>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Employee</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Clock In</th>
            <th className="py-3 px-4">Clock Out</th>
            <th className="py-3 px-4">Break</th>
            <th className="py-3 px-4">Working Hours</th>
            <th className="py-3 px-4">Short Hours</th>
            <th className="py-3 px-4">Extra Hours</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        );
      case 'leave':
        return (
          <tr>
            <th className="py-3 px-4">Employee</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Leave Type</th>
            <th className="py-3 px-4">Start Date</th>
            <th className="py-3 px-4">End Date</th>
            <th className="py-3 px-4">Days</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        );
      case 'overtime':
        return (
          <tr>
            <th className="py-3 px-4">Employee</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Shift</th>
            <th className="py-3 px-4">Extra Before Shift</th>
            <th className="py-3 px-4">Extra After Shift</th>
            <th className="py-3 px-4">Total Extra Hours</th>
            <th className="py-3 px-4">Verification</th>
            <th className="py-3 px-4">HR Approval</th>
          </tr>
        );
      case 'employee':
        return (
          <tr>
            <th className="py-3 px-4">Employee</th>
            <th className="py-3 px-4">Employee ID</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Designation</th>
            <th className="py-3 px-4">Joining Date</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        );
      case 'department':
        return (
          <tr>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Total Employees</th>
            <th className="py-3 px-4">Present</th>
            <th className="py-3 px-4">Absent</th>
            <th className="py-3 px-4">On Leave</th>
            <th className="py-3 px-4">Working Hours</th>
          </tr>
        );
      case 'activity':
        return (
          <tr>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Time</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Actor</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Action</th>
            <th className="py-3 px-4">Details</th>
          </tr>
        );
    }
  };

  const renderTableRows = () => {
    return records.map((row) => {
      if (category === 'attendance') {
        const att = row as AttendanceReportRow;
        return (
          <tr key={att.id} className="hover:bg-white/[0.02]">
            <td className="py-3 px-4 whitespace-nowrap">{att.date}</td>
            <td className="py-3 px-4">
              <div className="font-semibold text-white">{att.employeeName}</div>
              <div className="text-[11px] font-mono text-slate-500">{att.employeeCode}</div>
            </td>
            <td className="py-3 px-4">{att.department}</td>
            <td className="py-3 px-4 font-mono">{att.clockIn}</td>
            <td className="py-3 px-4 font-mono">{att.clockOut}</td>
            <td className="py-3 px-4 font-mono">{att.breakDuration}</td>
            <td className="py-3 px-4 font-mono font-semibold text-white">{att.workingHours}</td>
            <td className="py-3 px-4 font-mono text-amber-400">{att.shortHours}</td>
            <td className="py-3 px-4 font-mono text-emerald-400">{att.extraHours}</td>
            <td className="py-3 px-4">{att.status}</td>
          </tr>
        );
      }
      return null;
    });
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1015] border border-white/5 space-y-4 shadow-xl" id="hr-report-preview-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Report Preview: {getCategoryTitle()}</h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">{dateRangeLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
            id="report-export-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Loading report data...</span>
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">Unable to load report data.</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              An error occurred while communicating with the reporting service.
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-semibold text-slate-200">No report data available</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No data available for the selected filters. Select a different date range or wait for real data to be available.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {renderTableHeader()}
            </thead>
            <tbody className="divide-y divide-white/5">{renderTableRows()}</tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-300">{records.length}</strong> records (Total: {totalCount})
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 text-slate-300 font-mono">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
