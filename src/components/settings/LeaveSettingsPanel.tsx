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
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-base font-semibold text-white">Leave Management Policy Configuration</h3>
        <p className="text-xs text-slate-400 mt-1">
          Configure annual leave cycle definitions, recognized categories, and document compliance rules.
        </p>
      </div>

      {/* Leave Year Policy */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Annual Leave Year Period
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Leave Cycle Type</label>
            <select
              value={settings.leaveYearType}
              onChange={(e) =>
                onChange({ leaveYearType: e.target.value as 'Calendar Year' | 'Fiscal Year' })
              }
              className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Calendar Year">Calendar Year</option>
              <option value="Fiscal Year">Fiscal Year</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Cycle Start</label>
            <input
              type="text"
              value={settings.leaveYearStartMonth}
              onChange={(e) => onChange({ leaveYearStartMonth: e.target.value })}
              className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Cycle End</label>
            <input
              type="text"
              value={settings.leaveYearEndMonth}
              onChange={(e) => onChange({ leaveYearEndMonth: e.target.value })}
              className="w-full bg-[#14151e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Leave Types Configuration Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Recognized Leave Categories & Quotas
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-[#0f1015] border border-white/5 rounded-xl text-xs text-slate-300">
            <thead className="bg-white/[0.02] border-b border-white/5 text-[11px] font-semibold text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Annual Quota (Days)</th>
                <th className="py-3 px-4">Remuneration</th>
                <th className="py-3 px-4">Requires Proof / Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {settings.leaveTypes.map((lt, idx) => (
                <tr key={lt.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">{lt.name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{lt.code}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={lt.annualQuota}
                      onChange={(e) => handleQuotaChange(idx, Number(e.target.value))}
                      className="w-20 bg-[#14151e] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handlePaidToggle(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        lt.isPaid
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
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
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-white/5 text-slate-400 border-white/5'
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
