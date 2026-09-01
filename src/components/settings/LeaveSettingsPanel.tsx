import React from 'react';
import { LeaveSettings } from '../../types/settings';
import { CalendarDays, ShieldCheck, FileText, Check } from 'lucide-react';

interface LeaveSettingsPanelProps {
  settings: LeaveSettings;
  onChange: (updated: Partial<LeaveSettings>) => void;
}

export const LeaveSettingsPanel: React.FC<LeaveSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  const handleQuotaChange = (index: number, newQuota: number) => {
    const updatedTypes = [...settings.leaveTypes];
    updatedTypes[index] = {
      ...updatedTypes[index],
      annualQuota: newQuota,
    };
    onChange({ leaveTypes: updatedTypes });
  };

  const handlePaidToggle = (index: number) => {
    const updatedTypes = [...settings.leaveTypes];
    updatedTypes[index] = {
      ...updatedTypes[index],
      isPaid: !updatedTypes[index].isPaid,
    };
    onChange({ leaveTypes: updatedTypes });
  };

  const handleDocToggle = (index: number) => {
    const updatedTypes = [...settings.leaveTypes];
    updatedTypes[index] = {
      ...updatedTypes[index],
      requiresDocument: !updatedTypes[index].requiresDocument,
    };
    onChange({ leaveTypes: updatedTypes });
  };

  return (
    <div className="space-y-6" id="settings-panel-leave">
      <div className="border-b border-slate-200/70 pb-4">
        <h3 className="text-base font-semibold text-slate-900">Leave Management Policy Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure annual leave cycle definitions, recognized categories, and document compliance rules.
        </p>
      </div>

      {/* Leave Year Policy */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Annual Leave Year Period
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-600">Leave Cycle Type</label>
            <select
              value={settings.leaveYearType}
              onChange={(e) =>
                onChange({ leaveYearType: e.target.value as 'Calendar Year' | 'Fiscal Year' })
              }
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Calendar Year">Calendar Year</option>
              <option value="Fiscal Year">Fiscal Year</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-600">Cycle Start</label>
            <input
              type="text"
              value={settings.leaveYearStartMonth}
              onChange={(e) => onChange({ leaveYearStartMonth: e.target.value })}
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-600">Cycle End</label>
            <input
              type="text"
              value={settings.leaveYearEndMonth}
              onChange={(e) => onChange({ leaveYearEndMonth: e.target.value })}
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Leave Types Configuration Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Recognized Leave Categories & Quotas
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white/70 backdrop-blur-xl border border-slate-200/70 rounded-xl text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/70 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Annual Quota (Days)</th>
                <th className="py-3 px-4">Remuneration</th>
                <th className="py-3 px-4">Requires Proof / Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {settings.leaveTypes.map((lt, idx) => (
                <tr key={lt.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{lt.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{lt.code}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={lt.annualQuota}
                      onChange={(e) => handleQuotaChange(idx, Number(e.target.value))}
                      className="w-20 bg-slate-50/80 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handlePaidToggle(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        lt.isPaid
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-200/60 text-slate-600 border-slate-300'
                      }`}
                    >
                      {lt.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleDocToggle(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        lt.requiresDocument
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-slate-100/60 text-slate-500 border-slate-200/70'
                      }`}
                    >
                      {lt.requiresDocument ? 'Mandatory Proof' : 'Optional / None'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
