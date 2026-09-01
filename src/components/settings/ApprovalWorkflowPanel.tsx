import React from 'react';
import { ApprovalWorkflowSettings } from '../../types/settings';
import {
  User,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowDown,
  Clock,
  Workflow,
} from 'lucide-react';

interface ApprovalWorkflowPanelProps {
  settings: ApprovalWorkflowSettings;
  onChange: (updated: Partial<ApprovalWorkflowSettings>) => void;
}

export const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({
  settings,
  onChange,
}) => {
  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <User className="w-5 h-5 text-indigo-600" />;
      case 1:
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      case 2:
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 3:
        return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
      default:
        return <Workflow className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6" id="settings-panel-workflow">
      <div className="border-b border-slate-200/70 pb-4">
        <h3 className="text-base font-semibold text-slate-900">Approval Hierarchy & Delegation Workflow</h3>
        <p className="text-xs text-slate-500 mt-1">
          Visual multi-tier verification process governing leave requests, attendance corrections, and overtime payouts.
        </p>
      </div>

      {/* Visual Workflow Steps Flow */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Standard Approval Route
        </h4>

        <div className="space-y-3 max-w-xl mx-auto py-2">
          {settings.steps.map((step, idx) => (
            <React.Fragment key={step.stepNumber}>
              <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/70 flex items-center gap-4 relative shadow-md">
                <div className="w-10 h-10 rounded-xl bg-slate-100/60 border border-slate-200/80 flex items-center justify-center shrink-0">
                  {getStepIcon(idx)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100/60 text-slate-500 font-mono">
                      Step {step.stepNumber}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-900">{step.roleTitle}</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                </div>

                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Mandatory
                </span>
              </div>

              {idx < settings.steps.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100/60 border border-slate-200/80 flex items-center justify-center text-slate-400">
                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Escalation Rules */}
      <div className="pt-4 border-t border-slate-200/70 space-y-4">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Workflow Automation Rules
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Clock className="w-4 h-4 text-amber-600" />
              Auto-Escalation SLA
            </div>
            <p className="text-[11px] text-slate-500">
              Days after which an unanswered pending request is auto-escalated directly to HR Admin.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min={1}
                max={14}
                value={settings.autoEscalateDays}
                onChange={(e) => onChange({ autoEscalateDays: Number(e.target.value) })}
                className="w-20 bg-slate-50/80 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-500">Business Days</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900">Self-Approval Prohibition</div>
              <p className="text-[11px] text-slate-500">
                Department leads cannot approve their own personal leave or attendance corrections.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChange({ allowSelfApproval: !settings.allowSelfApproval })}
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                !settings.allowSelfApproval ? 'bg-indigo-600' : 'bg-slate-200/50'
              }`}
              id="toggle-self-approval"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  !settings.allowSelfApproval ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
