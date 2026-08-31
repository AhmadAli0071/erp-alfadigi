import React, { useState } from 'react';
import { PendingActionItem } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  X,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Sparkles,
  Building,
  User,
  AlertTriangle,
} from 'lucide-react';

interface HRActionModalProps {
  action: PendingActionItem | null;
  onClose: () => void;
  onApprove: (actionId: string, note?: string) => Promise<void>;
  onReject: (actionId: string, reason?: string) => Promise<void>;
}

export const HRActionModal: React.FC<HRActionModalProps> = ({
  action,
  onClose,
  onApprove,
  onReject,
}) => {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  if (!action) return null;

  const handleConfirmApprove = async () => {
    setIsProcessing(true);
    await onApprove(action.id, note.trim() || undefined);
    setIsProcessing(false);
    onClose();
  };

  const handleConfirmReject = async () => {
    setIsProcessing(true);
    await onReject(action.id, note.trim() || undefined);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      id="hr-action-review-modal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg bg-[#121318] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 animate-scaleUp text-slate-200 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {action.type === 'LEAVE_REQUEST' ? (
              <Calendar className="w-5 h-5" />
            ) : action.type === 'ATTENDANCE_CORRECTION' ? (
              <Clock className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Review {action.requestType}
            </h3>
            <p className="text-xs text-slate-400">
              Audit and endorse pending workforce request
            </p>
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-white">{action.employeeName}</span>
              <span className="font-mono text-[10px] text-slate-400">({action.employeeCode})</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300">
              {action.department}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block mb-0.5">Request Summary</span>
            <p className="text-sm font-semibold text-indigo-300">{action.details}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-400">
            <div>
              <span className="text-slate-500 block text-[10px]">Applied Date:</span>
              <span className="text-white font-medium">{action.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Submitted:</span>
              <span className="text-white font-medium">{action.submissionTime}</span>
            </div>
          </div>

          {action.appliedByLead && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{action.appliedByLead}</span>
            </div>
          )}
        </div>

        {/* Tab Selection (Approve vs Reject) */}
        <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('APPROVE')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'APPROVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve Request</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REJECT')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'REJECT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Request</span>
          </button>
        </div>

        {/* HR Note Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {activeTab === 'APPROVE' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
          </label>
          <textarea
            rows={3}
            placeholder={
              activeTab === 'APPROVE'
                ? 'e.g., Verified with team roster, approved for payroll inclusion.'
                : 'e.g., Insufficient leave quota or unverified shift log.'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            id="hr-review-note-input"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'APPROVE' ? (
            <button
              type="button"
              onClick={handleConfirmApprove}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="confirm-approve-btn"
            >
              {isProcessing ? 'Processing...' : 'Confirm Approval'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="confirm-reject-btn"
            >
              {isProcessing ? 'Processing...' : 'Confirm Rejection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
