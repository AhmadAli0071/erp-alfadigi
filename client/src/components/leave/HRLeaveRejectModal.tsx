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
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white/75 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>Reject Leave Request</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Target Request Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900">{request.employeeName}</span>
              <span className="text-slate-500">({request.employeeCode})</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-medium text-slate-600">{request.leaveType}</span>
              <span className="font-bold text-slate-900">({request.totalDays}d)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for rejection <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Please specify why this leave request is being declined (e.g. Insufficient leave balance, critical sprint milestone, lack of advance notice)..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition-colors"
              id="rejection-reason-textarea"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions */}
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
