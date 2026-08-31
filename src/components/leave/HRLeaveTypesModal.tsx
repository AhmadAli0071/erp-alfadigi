import React from 'react';
import { leaveService } from '../../services/leaveService';
import { X, Calendar, CheckCircle, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface HRLeaveTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HRLeaveTypesModal: React.FC<HRLeaveTypesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const leaveTypes = leaveService.getLeaveTypes();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="leave-types-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#0d0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#111217] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Company Leave Policies & Types</h2>
              <p className="text-xs text-slate-400">
                Official corporate quotas, carry-forward limits and approval guidelines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Cards Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveTypes.map((type) => (
              <div
                key={type.id}
                className="p-4 rounded-xl bg-[#111217] border border-white/5 space-y-3 shadow-sm hover:border-indigo-500/30 transition-colors"
              >
                {/* Title and Code Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{type.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {type.code}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      type.isPaid
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {type.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{type.description}</p>

                {/* Quota Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Annual Quota</span>
                    <span className="font-bold text-white font-mono">
                      {type.annualQuota} {type.annualQuota === 1 ? 'Day' : 'Days'}/yr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Carry Forward</span>
                    <span className="font-bold text-indigo-400 font-mono">
                      Max {type.carryForwardLimit} Days
                    </span>
                  </div>
                </div>

                {/* Requirements tags */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  {type.requiresLeadApproval && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Lead Approval
                    </span>
                  )}
                  {type.requiresDocument && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <ShieldAlert className="w-3 h-3 text-amber-400" /> Doc Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Policy notes footnote */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Enterprise Leave Rule:</strong> Pending leaves are displayed separately and do not alter the final available balance until authorized by HR. The calendar year spans from January 1 to December 31.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#111217] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
