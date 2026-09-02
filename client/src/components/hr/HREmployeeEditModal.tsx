import React, { useState, useEffect } from 'react';
import {
  Pencil,
  X,
  ChevronDown,
  AlertCircle,
  Trash2,
  RefreshCw,
  Save,
  Shield,
  KeyRound,
} from 'lucide-react';
import { Employee, DepartmentName } from '../../types/hr';

interface HREmployeeEditModalProps {
  employee: Employee;
  onClose: () => void;
  onUpdated: () => void;
}

const DEPARTMENT_OPTIONS = ['HR', 'Sales', 'Tech'];
const STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'];

export const HREmployeeEditModal: React.FC<HREmployeeEditModalProps> = ({
  employee,
  onClose,
  onUpdated,
}) => {
  const [tab, setTab] = useState<'details' | 'password'>('details');
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [department, setDepartment] = useState(employee.department);
  const [jobTitle, setJobTitle] = useState(employee.jobTitle);
  const [phone, setPhone] = useState(employee.phone || '');
  const [status, setStatus] = useState(employee.status);

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getToken = () => {
    try {
      return localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    } catch {
      return null;
    }
  };

  const handleSaveDetails = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email, department, jobTitle, phone, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Unable to update employee.');
        return;
      }
      setSuccessMessage('Employee updated successfully.');
      onUpdated();
    } catch {
      setErrorMessage('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/employees/${employee.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Unable to reset password.');
        return;
      }
      setSuccessMessage('Password reset successfully.');
      setNewPassword('');
    } catch {
      setErrorMessage('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Unable to delete employee.');
        setShowDeleteConfirm(false);
        return;
      }
      onUpdated();
      onClose();
    } catch {
      setErrorMessage('Unable to connect to server.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const inputClasses =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <Pencil className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Employee</h3>
              <p className="text-[11px] text-slate-500">{employee.name} — {employee.empId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200/70">
          <button
            type="button"
            onClick={() => { setTab('details'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'details'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 inline mr-1.5" />
            Details
          </button>
          <button
            type="button"
            onClick={() => { setTab('password'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'password'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
            Reset Password
          </button>
        </div>

        <div className="p-5">
          {tab === 'details' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as DepartmentName)}
                      className={`${inputClasses} appearance-none cursor-pointer pr-8`}
                    >
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Employee['status'])}
                      className={`${inputClasses} appearance-none cursor-pointer pr-8`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className={inputClasses}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Enter a new password for <span className="font-bold">{employee.name}</span>.
                  They will need to use this new password on their next login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`${inputClasses} pr-10 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 mt-4">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mt-4">
              <p className="text-[11px] text-emerald-700 font-medium">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200/70">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {tab === 'details' ? (
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 ${
                  isSubmitting ? 'bg-indigo-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting || newPassword.length < 8}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 ${
                  isSubmitting || newPassword.length < 8 ? 'bg-indigo-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm animate-scaleUp">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Employee</h3>
                <p className="text-xs text-slate-500 mb-5">
                  Are you sure you want to deactivate <span className="font-bold">{employee.name}</span>? They will no longer be able to log in.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
