import React, { useState } from 'react';
import { LeaveRequest } from '../../types/leave';
import { leaveService } from '../../services/leaveService';
import { CheckCircle2, X, Calendar, User, Clock, AlertCircle } from 'lucide-react';

interface HRLeaveApproveModalProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const HRLeaveApproveModal: React.FC<HRLeaveApproveModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hrNotes, setHrNotes] = useState('');

  if (!isOpen || !request) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const result = leaveService.approveLeaveRequest(
        request.id,
        hrNotes.trim() || 'Approved by HR Admin after policy and roster check.'
      );
      setIsSubmitting(false);
      if (result.success) {
        onSuccess(`Leave request ${request.id} approved successfully.`);
        onClose();
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="leave-approve-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white/75 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Approve Leave Request?</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-600 text-sm">
            Are you sure you want to approve this leave request? This will deduct the days from the employee's available balance and register the leave in the ERP attendance roster.
          </p>

          {/* Request Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Employee:
              </span>
              <span className="font-bold text-slate-900">
                {request.employeeName} ({request.employeeCode})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Leave Type:
              </span>
              <span className="font-semibold text-slate-700">{request.leaveType}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Dates:
              </span>
              <span className="font-medium text-slate-700">
                {request.startDateDisplay} — {request.endDateDisplay}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
              <span className="text-slate-500">Total Duration:</span>
              <span className="font-bold text-emerald-600 font-mono text-sm">
                {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>

          {/* Optional HR notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              HR Approval Note (Optional)
            </label>
            <input
              type="text"
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="e.g. Endorsed with standard team coverage arranged..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200/70 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="confirm-approve-leave-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Approving...' : 'Approve Leave'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
