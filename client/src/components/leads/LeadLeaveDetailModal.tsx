import React from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  User,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface LeaveRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  leadApprovalDate?: string;
  leadApprovalNote?: string;
  hrApprovalDate?: string;
  hrApprovalNote?: string;
  createdAt: string;
}

interface LeadLeaveDetailModalProps {
  leave: LeaveRecord | null;
  actionInProgress: string | null;
  leadCanDecide: boolean;
  onClose: () => void;
  onApprove: (leaveId: string) => void;
  onReject: (leaveId: string) => void;
}

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Pending Lead Approval
        </span>
      );
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved by Lead
        </span>
      );
    case 'Final Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved by HR
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
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

export const LeadLeaveDetailModal: React.FC<LeadLeaveDetailModalProps> = ({
  leave,
  actionInProgress,
  leadCanDecide,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!leave) return null;

  const busy = actionInProgress === leave.id;
  const showActions = leadCanDecide && leave.status === 'Pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="lead-leave-detail-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl bg-white border border-slate-200/80 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 border-b border-slate-200/70 flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Leave Request Details</h2>
                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {leave.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">Submitted on {leave.createdAt}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusPill status={leave.status} />
            {leadCanDecide && leave.status === 'Pending' && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Review and decide below
              </span>
            )}
          </div>

          {/* Employee info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Employee Information
              </h3>
              <span className="text-[11px] font-mono text-slate-500">{leave.employeeCode}</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/25 border border-slate-200/80 flex items-center justify-center font-black text-sm text-slate-900 shrink-0">
                {leave.employeeName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{leave.employeeName}</h4>
                <p className="text-xs text-slate-500">
                  <span className="text-indigo-600 font-semibold">{leave.department} Department</span>
                </p>
              </div>
            </div>
          </div>

          {/* Leave details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200/70 pb-3">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Leave Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Leave Type</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{leave.leaveType}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Duration</span>
                <span className="font-bold text-indigo-600 font-mono mt-0.5 block">
                  {leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Date Range</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {leave.startDate} to {leave.endDate}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="pt-2 border-t border-slate-200/70">
              <span className="text-[11px] text-slate-500 block mb-1">Reason for Leave</span>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {leave.reason ? `"${leave.reason}"` : 'No reason provided.'}
              </div>
            </div>
          </div>

          {/* Approval timeline */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200/70 pb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Approval Progress
            </h3>

            <div className="space-y-3">
              {/* Lead stage */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border ${
                    leave.leadApprovalDate
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : leave.status === 'Pending'
                      ? 'bg-amber-100/70 text-amber-600 border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {leave.leadApprovalDate ? '✓' : '1'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">Lead Approval</span>
                    {leave.leadApprovalDate && (
                      <span className="text-[10px] font-mono text-slate-500">{leave.leadApprovalDate}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {leave.leadApprovalDate
                      ? leave.leadApprovalNote || 'Endorsed by department lead'
                      : leave.status === 'Rejected'
                      ? 'Not reached'
                      : 'Waiting for your decision'}
                  </p>
                </div>
              </div>

              {/* HR stage */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border ${
                    leave.hrApprovalDate
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {leave.hrApprovalDate ? '✓' : '2'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">HR Approval</span>
                    {leave.hrApprovalDate && (
                      <span className="text-[10px] font-mono text-slate-500">{leave.hrApprovalDate}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {leave.hrApprovalDate
                      ? leave.hrApprovalNote || 'Final approval by HR'
                      : leave.status === 'Rejected'
                      ? 'Not reached'
                      : 'Pending after your endorsement'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 sm:p-5 border-t border-slate-200/70 bg-slate-50 rounded-b-3xl">
          {showActions ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onReject(leave.id)}
                disabled={busy}
                className="flex-1 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={() => onApprove(leave.id)}
                disabled={busy}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Leave</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <span>
                {leave.status === 'Pending'
                  ? 'HR decides this leave type directly.'
                  : `This request is finalized as `}
                {leave.status === 'Pending' ? '' : <strong className="text-slate-900">{leave.status}</strong>}
                .
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100/60 hover:bg-slate-200/50 text-slate-900 text-xs font-semibold cursor-pointer"
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
