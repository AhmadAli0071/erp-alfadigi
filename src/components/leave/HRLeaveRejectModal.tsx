import React, { useState } from 'react';
import { LeaveRequest } from '../../types/leave';
import { leaveService } from '../../services/leaveService';
import { XCircle, X, AlertTriangle, User, Calendar } from 'lucide-react';

interface HRLeaveRejectModalProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const HRLeaveRejectModal: React.FC<HRLeaveRejectModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for rejection.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const result = leaveService.rejectLeaveRequest(request.id, reason.trim());
      setIsSubmitting(false);
      if (result.success) {
        onSuccess(`Leave request ${request.id} rejected.`);
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="leave-reject-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0d0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#111217]">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>Reject Leave Request</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Target Request Info */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-white">{request.employeeName}</span>
              <span className="text-slate-400">({request.employeeCode})</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-slate-300">{request.leaveType}</span>
              <span className="font-bold text-white">({request.totalDays}d)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Reason for rejection <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Please specify why this leave request is being declined (e.g. Insufficient leave balance, critical sprint milestone, lack of advance notice)..."
              className="w-full bg-[#111217] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition-colors"
              id="rejection-reason-textarea"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions */}
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="confirm-reject-leave-btn"
          >
            <XCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Rejecting...' : 'Reject Leave'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
