import React, { useState, useEffect, useCallback } from 'react';
import { LeaveSettings } from '../../types/settings';
import { leaveTypeService, LeaveTypePolicy } from '../../services/leaveTypeService';
import { CalendarDays, Loader2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface LeaveSettingsPanelProps {
  settings: LeaveSettings;
  onChange: (updated: Partial<LeaveSettings>) => void;
}

export const LeaveSettingsPanel: React.FC<LeaveSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  const [types, setTypes] = useState<LeaveTypePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await leaveTypeService.getLeaveTypes(true);
      setTypes(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load leave types.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const patchType = async (type: LeaveTypePolicy, patch: Partial<LeaveTypePolicy>) => {
    setSavingId(type.id);
    try {
      const updated = await leaveTypeService.updateLeaveType(type.id, patch);
      setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSavedId(type.id);
      setTimeout(() => setSavedId((cur) => (cur === type.id ? null : cur)), 2000);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to save change.');
    } finally {
      setSavingId(null);
    }
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

      {/* Leave Types Configuration Table (live) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Recognized Leave Categories & Quotas
          </h4>
          <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
            {savingId ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </>
            ) : savedId ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Saved
              </>
            ) : (
              'Changes save instantly'
            )}
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-500">Loading leave types…</span>
          </div>
        ) : loadError ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {loadError}
            </span>
            <button onClick={fetchTypes} className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white/70 backdrop-blur-xl border border-slate-200/70 rounded-xl text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/70 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Annual Quota (Days)</th>
                  <th className="py-3 px-4">Remuneration</th>
                  <th className="py-3 px-4">Requires Proof / Slip</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {types.map((lt) => (
                  <tr key={lt.id} className={`hover:bg-slate-50 ${!lt.isActive ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{lt.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{lt.code}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        defaultValue={lt.annualQuota}
                        key={`${lt.id}-${lt.annualQuota}`}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val) && val !== lt.annualQuota && val >= 0 && val <= 365) {
                            patchType(lt, { annualQuota: val });
                          }
                        }}
                        className="w-20 bg-slate-50/80 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={savingId === lt.id}
                        onClick={() => patchType(lt, { isPaid: !lt.isPaid })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
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
                        disabled={savingId === lt.id}
                        onClick={() => patchType(lt, { requiresDocument: !lt.requiresDocument })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                          lt.requiresDocument
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-slate-100/60 text-slate-500 border-slate-200/70'
                        }`}
                      >
                        {lt.requiresDocument ? 'Mandatory Proof' : 'Optional / None'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          lt.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-200/60 text-slate-500 border-slate-300'
                        }`}
                      >
                        {lt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs text-indigo-600 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            These leave types are shared company-wide — employees can only request active types.
            To add, rename, or deactivate types, use <strong>Leave Management → Leave Types</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
