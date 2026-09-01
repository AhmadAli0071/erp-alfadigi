import React from 'react';
import { LeaveRequest } from '../../types/leave';
import { leaveService } from '../../services/leaveService';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  FileText,
  User,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface HRLeaveRequestDetailDrawerProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenApproveModal: (request: LeaveRequest) => void;
  onOpenRejectModal: (request: LeaveRequest) => void;
}

export const HRLeaveRequestDetailDrawer: React.FC<HRLeaveRequestDetailDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onOpenApproveModal,
  onOpenRejectModal,
}) => {
  if (!isOpen || !request) return null;

  const empBalance = leaveService.getEmployeeBalance(request.employeeId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending HR Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-200/60 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="leave-detail-drawer-container">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel (Desktop Slide-over, Mobile Full-screen) */}
      <div className="relative w-full max-w-2xl h-full bg-white/85 backdrop-blur-2xl border-l border-slate-200/80 sm:rounded-l-3xl text-slate-700 shadow-2xl flex flex-col z-10 overflow-hidden animate-slideLeft overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Leave Request</h2>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {request.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">Submitted on {request.submittedDate}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
            aria-label="Close detail drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Current Status
              </span>
              <div>{getStatusBadge(request.status)}</div>
            </div>

            {request.status === 'Pending' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Lead endorsed • Ready for HR action
                </span>
              </div>
            )}
          </div>

          {/* Rejection notice if rejected */}
          {request.status === 'Rejected' && request.rejectionReason && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-600 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Rejection Reason</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-6">{request.rejectionReason}</p>
            </div>
          )}

          {/* Employee Profile & Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Employee Information
              </h3>
              <span className="text-[11px] font-mono text-slate-500">{request.employeeCode}</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/25 border border-slate-200/80 flex items-center justify-center font-black text-sm text-slate-900 shadow-md shrink-0">
                {request.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{request.employeeName}</h4>
                <p className="text-xs text-slate-500 truncate">
                  {request.designation} •{' '}
                  <span className="text-indigo-600 font-semibold">{request.department} Department</span>
                </p>
              </div>
            </div>

            {/* Leave Balances Grid */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2.5">
                Leave Balance ({empBalance.year})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Casual */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block truncate font-medium">Casual Leave</span>
                  <div className="text-sm font-mono font-bold text-indigo-600 mt-0.5">
                    {empBalance.categories.casual.available} <span className="text-[10px] font-normal text-slate-500">Avail</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Used: {empBalance.categories.casual.used}</span>
                    <span>Pend: {empBalance.categories.casual.pending}</span>
                  </div>
                </div>

                {/* Annual */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block truncate font-medium">Annual Leave</span>
                  <div className="text-sm font-mono font-bold text-emerald-600 mt-0.5">
                    {empBalance.categories.annual.available} <span className="text-[10px] font-normal text-slate-500">Avail</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Used: {empBalance.categories.annual.used}</span>
                    <span>Pend: {empBalance.categories.annual.pending}</span>
                  </div>
                </div>

                {/* Sick */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block truncate font-medium">Sick Leave</span>
                  <div className="text-sm font-mono font-bold text-amber-600 mt-0.5">
                    {empBalance.categories.sick.available} <span className="text-[10px] font-normal text-slate-500">Avail</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Used: {empBalance.categories.sick.used}</span>
                    <span>Pend: {empBalance.categories.sick.pending}</span>
                  </div>
                </div>

                {/* Unpaid */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 block truncate font-medium">Unpaid Leave</span>
                  <div className="text-sm font-mono font-bold text-rose-600 mt-0.5">
                    {empBalance.categories.unpaid.used} <span className="text-[10px] font-normal text-slate-500">Used</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    <span>No Quota</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Request Specification */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200/70 pb-3">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Leave Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Leave Type</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{request.leaveType}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Duration</span>
                <span className="font-bold text-indigo-600 font-mono mt-0.5 block">
                  {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Submitted At</span>
                <span className="font-medium text-slate-600 mt-0.5 block">
                  {request.submittedDate} ({request.submittedTime})
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[11px] text-slate-500 block">Date Range</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {request.startDateDisplay} — {request.endDateDisplay}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="pt-2 border-t border-slate-200/70">
              <span className="text-[11px] text-slate-500 block mb-1">Reason for Leave</span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                "{request.reason}"
              </div>
            </div>
          </div>

          {/* Approval Flow Timeline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Approval Flow & Audit History
              </h3>
              <span className="text-[10px] text-slate-400">4-Stage Pipeline</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/50">
              {request.timeline.map((step) => {
                const isCompleted = step.statusLabel === 'Completed';
                const isRejected = step.statusLabel === 'Rejected';
                const isPending = step.statusLabel === 'Pending';

                return (
                  <div key={step.id} className="relative group">
                    {/* Node marker icon */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30'
                          : isRejected
                          ? 'bg-rose-600 text-white border-rose-500'
                          : isPending
                          ? 'bg-amber-100/70 text-amber-600 border-amber-300 animate-pulse'
                          : 'bg-slate-50 text-slate-400 border-slate-200/80'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : isRejected ? (
                        <X className="w-3 h-3 stroke-[3]" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>

                    {/* Step details */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          Step {step.stepNumber}: {step.role}
                        </span>
                        {step.timestamp && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {step.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5">
                        <span className="text-slate-500">Actor:</span>{' '}
                        <span className="font-semibold text-slate-700">{step.actorName}</span>
                      </div>

                      {step.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg p-2 mt-1.5">
                          {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer (Sticky bottom) */}
        <div className="p-4 sm:p-5 border-t border-slate-200/70 bg-slate-50 shrink-0">
          {request.status === 'Pending' ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenRejectModal(request)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                id="leave-drawer-reject-btn"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenApproveModal(request)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                id="leave-drawer-approve-btn"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Leave</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>This request has been finalized as <strong className="text-slate-900">{request.status}</strong>.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100/60 hover:bg-slate-200/50 text-slate-900 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
