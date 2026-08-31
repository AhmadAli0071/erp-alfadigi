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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0d0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Approve Leave Request?</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-300 text-sm">
            Are you sure you want to approve this leave request? This will deduct the days from the employee's available balance and register the leave in the ERP attendance roster.
          </p>

          {/* Request Summary Box */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Employee:
              </span>
              <span className="font-bold text-white">
                {request.employeeName} ({request.employeeCode})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Leave Type:
              </span>
              <span className="font-semibold text-slate-200">{request.leaveType}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Dates:
              </span>
              <span className="font-medium text-slate-200">
                {request.startDateDisplay} — {request.endDateDisplay}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-slate-400">Total Duration:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>

          {/* Optional HR notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              HR Approval Note (Optional)
            </label>
            <input
              type="text"
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="e.g. Endorsed with standard team coverage arranged..."
              className="w-full bg-[#111217] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#111217] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold cursor-pointer"
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
