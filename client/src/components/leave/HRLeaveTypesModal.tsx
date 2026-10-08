import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  leaveTypeService,
  LeaveTypePolicy,
  LeaveTypeInput,
} from '../../services/leaveTypeService';
import {
  X,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Plus,
  Pencil,
  Power,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';

interface HRLeaveTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  'bg-indigo-500/15 text-indigo-600 border-indigo-500/30',
  'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'bg-purple-500/15 text-purple-600 border-purple-500/30',
  'bg-sky-500/15 text-sky-600 border-sky-500/30',
  'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30',
];

interface FormState {
  name: string;
  code: string;
  annualQuota: number;
  carryForwardLimit: number;
  isPaid: boolean;
  requiresLeadApproval: boolean;
  requiresDocument: boolean;
  description: string;
  colorBadge: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  annualQuota: 0,
  carryForwardLimit: 0,
  isPaid: true,
  requiresLeadApproval: true,
  requiresDocument: false,
  description: '',
  colorBadge: COLOR_PRESETS[0],
};

export const HRLeaveTypesModal: React.FC<HRLeaveTypesModalProps> = ({ isOpen, onClose }) => {
  const [types, setTypes] = useState<LeaveTypePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // null = list view, 'new' = create, id = edit
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
    if (isOpen) {
      fetchTypes();
      setEditingId(null);
      setFormError(null);
    }
  }, [isOpen, fetchTypes]);

  if (!isOpen) return null;

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingId('new');
  };

  const startEdit = (t: LeaveTypePolicy) => {
    setForm({
      name: t.name,
      code: t.code,
      annualQuota: t.annualQuota,
      carryForwardLimit: t.carryForwardLimit,
      isPaid: t.isPaid,
      requiresLeadApproval: t.requiresLeadApproval,
      requiresDocument: t.requiresDocument,
      description: t.description,
      colorBadge: t.colorBadge,
    });
    setFormError(null);
    setEditingId(t.id);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const payload: LeaveTypeInput = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        annualQuota: Number(form.annualQuota) || 0,
        carryForwardLimit: Number(form.carryForwardLimit) || 0,
        isPaid: form.isPaid,
        requiresLeadApproval: form.requiresLeadApproval,
        requiresDocument: form.requiresDocument,
        description: form.description.trim(),
        colorBadge: form.colorBadge,
      };
      if (editingId === 'new') {
        await leaveTypeService.createLeaveType(payload);
      } else if (editingId) {
        await leaveTypeService.updateLeaveType(editingId, payload);
      }
      setEditingId(null);
      await fetchTypes();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save leave type.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (t: LeaveTypePolicy) => {
    setActionInProgress(t.id);
    try {
      if (t.isActive) {
        await leaveTypeService.deactivateLeaveType(t.id);
      } else {
        await leaveTypeService.updateLeaveType(t.id, { isActive: true });
      }
      await fetchTypes();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  const activeTypes = types.filter((t) => t.isActive);
  const inactiveTypes = types.filter((t) => !t.isActive);

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
        value
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : 'bg-slate-100/70 text-slate-500 border-slate-200/80'
      }`}
    >
      {value ? 'Yes' : 'No'}, {label}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="leave-types-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={() => editingId === null && onClose()}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white/75 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Leave Types & Policies</h2>
              <p className="text-xs text-slate-500">
                Managed company-wide. Employees can only request these types
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingId === null && (
              <button
                type="button"
                onClick={startCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Type
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-500">Loading leave types…</p>
            </div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-rose-600 mb-3">{loadError}</p>
              <button onClick={fetchTypes} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                Try again
              </button>
            </div>
          ) : editingId !== null ? (
            /* ---------------- Create / Edit Form ---------------- */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId === 'new' ? 'New Leave Type' : 'Edit Leave Type'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Casual Leave"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CL"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono font-bold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Annual Quota (days)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={form.annualQuota}
                    onChange={(e) => setForm({ ...form, annualQuota: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Carry Forward Limit (days)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={form.carryForwardLimit}
                    onChange={(e) => setForm({ ...form, carryForwardLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Short policy description shown to employees…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {renderToggle('Paid', form.isPaid, (v) => setForm({ ...form, isPaid: v }))}
                {renderToggle('HOD Approval', form.requiresLeadApproval, (v) => setForm({ ...form, requiresLeadApproval: v }))}
                {renderToggle('Document Required', form.requiresDocument, (v) => setForm({ ...form, requiresDocument: v }))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Badge Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, colorBadge: c })}
                      className={`w-8 h-8 rounded-lg border ${c} cursor-pointer transition-transform ${form.colorBadge === c ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : 'hover:scale-105'}`}
                      aria-label="Pick color"
                    />
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-100/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingId === 'new' ? 'Create Type' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* ---------------- Types List ---------------- */
            <>
              {activeTypes.length === 0 && inactiveTypes.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No leave types configured yet.</p>
                  <button onClick={startCreate} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    Create the first leave type
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {types.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 rounded-xl border space-y-3 shadow-sm transition-colors ${
                        type.isActive
                          ? 'bg-slate-50 border-slate-200/70 hover:border-indigo-200'
                          : 'bg-slate-100/60 border-slate-200/50 opacity-70'
                      }`}
                    >
                      {/* Title and Code Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{type.name}</h3>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${type.colorBadge}`}>
                            {type.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              type.isPaid
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-rose-50 text-rose-600 border-rose-200'
                            }`}
                          >
                            {type.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          {!type.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-200/60 text-slate-500 border-slate-300">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">{type.description || '-'}</p>

                      {/* Quota Metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Annual Quota</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {type.annualQuota} {type.annualQuota === 1 ? 'Day' : 'Days'}/yr
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Carry Forward</span>
                          <span className="font-bold text-indigo-600 font-mono">Max {type.carryForwardLimit} Days</span>
                        </div>
                      </div>

                      {/* Requirements tags */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 flex-wrap">
                        {type.requiresLeadApproval && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> HOD Approval
                          </span>
                        )}
                        {type.requiresDocument && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <ShieldAlert className="w-3 h-3 text-amber-600" /> Doc Required
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => startEdit(type)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-white text-[10px] font-bold text-slate-600 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(type)}
                          disabled={actionInProgress === type.id}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-40 border ${
                            type.isActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {actionInProgress === type.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          {type.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Policy notes footnote */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs text-indigo-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Enterprise Leave Rule:</strong> Deactivating a type never affects existing leave records. Employees
                  simply can't request it anymore. Quotas define yearly allocation per employee.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {editingId === null && (
          <div className="p-4 border-t border-slate-200/70 bg-slate-50 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
