import React from 'react';
import { AttendanceSettings } from '../../types/settings';
import { Clock, ShieldAlert, Coffee, Hourglass, Check } from 'lucide-react';

interface AttendanceSettingsPanelProps {
  settings: AttendanceSettings;
  onChange: (updated: Partial<AttendanceSettings>) => void;
}

export const AttendanceSettingsPanel: React.FC<AttendanceSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6" id="settings-panel-attendance">
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-base font-semibold text-white">Attendance & Shift Timing Rules</h3>
        <p className="text-xs text-slate-400 mt-1">
          Configure core night shift operational hours, biometric tolerance thresholds, and break rules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Shift Start */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Standard Shift Start Time
          </label>
          <input
            type="text"
            value={settings.shiftStart}
            onChange={(e) => onChange({ shiftStart: e.target.value })}
            placeholder="06:00 PM"
            className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            id="attendance-shift-start"
          />
          <p className="text-[11px] text-slate-500">Official daily shift check-in target time.</p>
        </div>

        {/* Shift End */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Standard Shift End Time
          </label>
          <input
            type="text"
            value={settings.shiftEnd}
            onChange={(e) => onChange({ shiftEnd: e.target.value })}
            placeholder="03:00 AM"
            className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            id="attendance-shift-end"
          />
          <p className="text-[11px] text-slate-500">Standard overnight shift punch-out cutoff time.</p>
        </div>

        {/* Required Working Hours */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
            Required Net Working Hours
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={16}
              value={settings.requiredWorkingHours}
              onChange={(e) => onChange({ requiredWorkingHours: Number(e.target.value) })}
              className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              id="attendance-required-hours"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">Hours / shift</span>
          </div>
          <p className="text-[11px] text-slate-500">Benchmark for complete full-day attendance validation.</p>
        </div>

        {/* Grace Period */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            Late Punch Grace Period
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={60}
              value={settings.gracePeriodMinutes}
              onChange={(e) => onChange({ gracePeriodMinutes: Number(e.target.value) })}
              className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              id="attendance-grace-period"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">Minutes</span>
          </div>
          <p className="text-[11px] text-slate-500">Punches within this window (e.g. up to 6:05 PM) are marked Present.</p>
        </div>
      </div>

      {/* Break Deduction & Unlimited Duration Toggles */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Break Policies</h4>

        <div className="space-y-3">
          {/* Break Deduction */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-indigo-400" />
                Automatic Break Deduction
              </div>
              <p className="text-[11px] text-slate-400">
                Automatically subtract logged break intervals from gross shift time to calculate net working hours.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChange({ breakDeductionEnabled: !settings.breakDeductionEnabled })}
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                settings.breakDeductionEnabled ? 'bg-indigo-600' : 'bg-white/10'
              }`}
              id="toggle-break-deduction"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.breakDeductionEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Unlimited Break Duration */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-indigo-400" />
                Flexible Break Duration
              </div>
              <p className="text-[11px] text-slate-400">
                Allow employees flexible break intervals while strictly accounting for net working duration.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onChange({ unlimitedBreakDurationEnabled: !settings.unlimitedBreakDurationEnabled })
              }
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                settings.unlimitedBreakDurationEnabled ? 'bg-indigo-600' : 'bg-white/10'
              }`}
              id="toggle-unlimited-breaks"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.unlimitedBreakDurationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
