import React from 'react';
import { GeneralSettings } from '../../types/settings';
import { Building2, Globe, Calendar, Clock, Sliders } from 'lucide-react';

interface GeneralSettingsPanelProps {
  settings: GeneralSettings;
  onChange: (updated: Partial<GeneralSettings>) => void;
}

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6" id="settings-panel-general">
      <div className="border-b border-slate-200/70 pb-4">
        <h3 className="text-base font-semibold text-slate-900">General System Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure ERP application identity, internationalization, and standard date formats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* System Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            System Name
          </label>
          <input
            type="text"
            value={settings.systemName}
            onChange={(e) => onChange({ systemName: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            id="general-system-name"
          />
          <p className="text-[11px] text-slate-400">The branded portal title shown across dashboard headers.</p>
        </div>

        {/* Company / Workspace Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Company Name
          </label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            id="general-company-name"
          />
          <p className="text-[11px] text-slate-400">Legal entity name utilized on generated exports and payslips.</p>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            System Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            id="general-timezone"
          >
            <option value="Asia/Karachi (UTC+05:00)">Asia/Karachi (UTC+05:00 - PKT)</option>
            <option value="Asia/Dubai (UTC+04:00)">Asia/Dubai (UTC+04:00 - GST)</option>
            <option value="Asia/Riyadh (UTC+03:00)">Asia/Riyadh (UTC+03:00 - AST)</option>
            <option value="Europe/London (UTC+00:00)">Europe/London (UTC+00:00 - GMT)</option>
            <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00 - EST)</option>
          </select>
          <p className="text-[11px] text-slate-400">Reference timezone for biometric time clocks and daily cutoffs.</p>
        </div>

        {/* Date Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => onChange({ dateFormat: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            id="general-date-format"
          >
            <option value="DD MMM YYYY">DD MMM YYYY (e.g. 31 Aug 2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (UK / EU)</option>
          </select>
          <p className="text-[11px] text-slate-400">Standard display format for calendar and report grids.</p>
        </div>

        {/* Time Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Time Format
          </label>
          <select
            value={settings.timeFormat}
            onChange={(e) => onChange({ timeFormat: e.target.value })}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            id="general-time-format"
          >
            <option value="12-Hour (06:00 PM)">12-Hour (e.g. 06:00 PM)</option>
            <option value="24-Hour (18:00)">24-Hour (e.g. 18:00)</option>
          </select>
          <p className="text-[11px] text-slate-400">Biometric time presentation style across rosters.</p>
        </div>
      </div>
    </div>
  );
};
