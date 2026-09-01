import React from 'react';
import { OvertimeSettings } from '../../types/settings';
import { Flame, Clock, ShieldCheck, Ticket } from 'lucide-react';

interface OvertimeSettingsPanelProps {
  settings: OvertimeSettings;
  onChange: (updated: Partial<OvertimeSettings>) => void;
}

export const OvertimeSettingsPanel: React.FC<OvertimeSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6" id="settings-panel-overtime">
      <div className="border-b border-slate-200/70 pb-4">
        <h3 className="text-base font-semibold text-slate-900">Overtime & Extra Hours Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure rules for logging, verifying, and generating support tickets for extra working hours.
        </p>
      </div>

      <div className="space-y-4">
        {/* Overtime Before Shift */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pre-Shift Early Clock-In Overtime
            </div>
            <p className="text-[11px] text-slate-500">
              Capture and record verified extra hours logged prior to the standard 6:00 PM shift start.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({ overtimeBeforeShiftEnabled: !settings.overtimeBeforeShiftEnabled })
            }
            className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              settings.overtimeBeforeShiftEnabled ? 'bg-indigo-600' : 'bg-slate-200/50'
            }`}
            id="toggle-ot-before-shift"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.overtimeBeforeShiftEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Overtime After Shift */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Post-Shift Late Clock-Out Overtime
            </div>
            <p className="text-[11px] text-slate-500">
              Capture and record verified extra hours logged after the standard 3:00 AM shift finish.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({ overtimeAfterShiftEnabled: !settings.overtimeAfterShiftEnabled })
            }
            className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              settings.overtimeAfterShiftEnabled ? 'bg-indigo-600' : 'bg-slate-200/50'
            }`}
            id="toggle-ot-after-shift"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.overtimeAfterShiftEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* HR Verification Required */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Mandatory HR Admin Verification
            </div>
            <p className="text-[11px] text-slate-500">
              Require explicit approval from HR or Lead before extra hours are credited to payroll.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({ hrVerificationRequired: !settings.hrVerificationRequired })
            }
            className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              settings.hrVerificationRequired ? 'bg-indigo-600' : 'bg-slate-200/50'
            }`}
            id="toggle-ot-hr-verification"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.hrVerificationRequired ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Automatic Overtime Ticket */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" />
              Automatic Overtime Verification Ticket
            </div>
            <p className="text-[11px] text-slate-500">
              Automatically spawn an internal verification ticket in Ticket Management when an employee logs significant extra hours.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({ automaticOvertimeTicket: !settings.automaticOvertimeTicket })
            }
            className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              settings.automaticOvertimeTicket ? 'bg-indigo-600' : 'bg-slate-200/50'
            }`}
            id="toggle-ot-auto-ticket"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.automaticOvertimeTicket ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
