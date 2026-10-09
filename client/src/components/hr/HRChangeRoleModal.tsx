import React, { useState } from 'react';
import { Employee } from '../../types/hr';
import { UserRole } from '../../types/auth';
import {
  X,
  Crown,
  Users,
  UserCheck,
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_ADMIN: 'HR Admin',
  DEPARTMENT_LEAD: 'Department Lead',
  HOD: 'Head of Department',
  EMPLOYEE: 'Employee',
};

interface RoleOption {
  value: UserRole;
  label: string;
  icon: React.ReactNode;
  chip: string;
  activeChip: string;
}

interface HRChangeRoleModalProps {
  employee: Employee;
  onClose: () => void;
  onRoleChanged: (message: string) => void;
}

export const HRChangeRoleModal: React.FC<HRChangeRoleModalProps> = ({
  employee,
  onClose,
  onRoleChanged,
}) => {
  const currentRole = employee.role || null;
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: RoleOption[] = [
    {
      value: 'EMPLOYEE',
      label: 'Employee',
      icon: <UserCheck className="w-4 h-4" />,
      chip: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      activeChip: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      value: 'DEPARTMENT_LEAD',
      label: 'Department Lead',
      icon: <Users className="w-4 h-4" />,
      chip: 'bg-sky-50 text-sky-600 border-sky-200',
      activeChip: 'bg-sky-600 text-white border-sky-600',
    },
    {
      value: 'HOD',
      label: 'Head of Department',
      icon: <Crown className="w-4 h-4" />,
      chip: 'bg-amber-50 text-amber-600 border-amber-200',
      activeChip: 'bg-amber-500 text-slate-950 border-amber-500',
    },
  ];

  const getOptionNote = (value: UserRole): string => {
    if (value === 'HOD') {
      return `${employee.name} will become HOD of the ${employee.department} department — first approver for that department's leaves and tickets.`;
    }
    if (value === 'DEPARTMENT_LEAD') {
      return `${employee.name} will be able to approve leaves and tickets for teammates assigned to them via "Reports To".`;
    }
    // EMPLOYEE
    if (currentRole === 'DEPARTMENT_LEAD' || currentRole === 'HOD') {
      return `${employee.name} will become a regular employee. Their direct reports will be unassigned and will need a new lead.`;
    }
    return `${employee.name} will remain/become a regular employee with no approval rights.`;
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;
    if (!employee.accountId) {
      setError('This employee has no login account, so their role cannot be changed.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/accounts/${employee.accountId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to change role.');
      } else {
        const detached = Number(data.detachedReports || 0);
        onRoleChanged(
          `${employee.name} is now ${ROLE_LABELS[selectedRole]}.` +
            (detached > 0 ? ` ${detached} direct report${detached === 1 ? '' : 's'} unassigned.` : '')
        );
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      id="hr-change-role-modal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl p-5 z-10 animate-scaleUp text-slate-700 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Change Role</h3>
            <p className="text-xs text-slate-500">Promote or demote this employee's access level</p>
          </div>
        </div>

        {/* Employee + Current Role */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{employee.name}</div>
            <div className="text-[10px] font-mono text-slate-500">
              {employee.empId} · {employee.department}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block mb-1">Current role</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
              {currentRole ? ROLE_LABELS[currentRole] || currentRole : 'No login account'}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Role Options */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-600">Set new role</span>
          {options.map((opt) => {
            const isCurrent = currentRole === opt.value;
            const isSelected = selectedRole === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isCurrent || isProcessing}
                onClick={() => setSelectedRole(opt.value)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/60 shadow-sm'
                    : 'border-slate-200/80 bg-white/70 hover:border-slate-300'
                } ${isCurrent ? 'opacity-50' : ''}`}
                id={`role-option-${opt.value}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                    isSelected ? opt.activeChip : opt.chip
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                    {isCurrent ? (
                      <span className="text-[10px] font-semibold text-slate-400">Current</span>
                    ) : (
                      isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    {getOptionNote(opt.value)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedRole || isProcessing}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            id="confirm-role-change-btn"
          >
            {isProcessing ? 'Updating…' : 'Update Role'}
          </button>
        </div>
      </div>
    </div>
  );
};
