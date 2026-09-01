import React, { useState } from 'react';
import {
  UserPlus,
  X,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Mail,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { authService, StoredUserAccount } from '../../services/authService';
import { UserRole } from '../../types/auth';

interface HRCreateUserModalProps {
  onClose: () => void;
  onUserCreated: (account: StoredUserAccount) => void;
}

const DEPARTMENT_OPTIONS = ['HR', 'Sales', 'Tech'];

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee', hint: 'Self-service portal access' },
  { value: 'DEPARTMENT_LEAD', label: 'Department Lead', hint: 'Team dashboard + approvals' },
  { value: 'HR_ADMIN', label: 'HR Admin', hint: 'Full HR management access' },
];

const generatePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const HRCreateUserModal: React.FC<HRCreateUserModalProps> = ({
  onClose,
  onUserCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Sales');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<StoredUserAccount | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await authService.createUserAccount({
        name: fullName,
        email,
        password,
        role,
        department,
        jobTitle,
      });
      if (result.success && result.account) {
        setCreatedAccount(result.account);
        onUserCreated(result.account);
      } else {
        setErrorMessage(result.error || 'Unable to create account.');
      }
    } catch {
      setErrorMessage('Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    jobTitle.trim().length > 0 &&
    password.length >= 8;

  const inputClasses =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all';

  // ---- Success screen ----
  if (createdAccount) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={onClose} />
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 animate-scaleUp">
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200/70">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Account Created</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Share these credentials with{' '}
              <span className="font-semibold text-slate-700">{createdAccount.name}</span> so they
              can sign in.
            </p>
          </div>

          <div className="space-y-3 mt-5">
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200/70 shrink-0">
                  <Mail className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Login Email
                  </p>
                  <p className="text-xs font-bold text-slate-900 truncate">{createdAccount.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('email', createdAccount.email)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                title="Copy email"
              >
                {copiedField === 'email' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white border border-slate-200/70 shrink-0">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Password
                  </p>
                  <p className="text-xs font-bold text-slate-900 font-mono truncate">
                    {createdAccount.password}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('password', createdAccount.password)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              The employee should change this password after first sign-in. Accounts are stored
              locally until the backend is connected.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setCreatedAccount(null);
                setFullName('');
                setEmail('');
                setJobTitle('');
                setRole('EMPLOYEE');
                setPassword(generatePassword());
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Create Another
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form screen ----
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create User Account</h3>
              <p className="text-[11px] text-slate-500">
                Onboard a new employee with portal login access
              </p>
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

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ahmed Khan"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Account Executive"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Login Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ahmed.khan@alfadigi.local"
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`${inputClasses} appearance-none cursor-pointer pr-8`}
                >
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`${inputClasses} appearance-none cursor-pointer pr-8`}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Role Access
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {ROLE_OPTIONS.find((r) => r.value === role)?.hint}
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>
                Password <span className="text-rose-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPassword(generatePassword());
                  setShowPassword(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Auto-generate
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`${inputClasses} pr-10 font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    password.length >= 12
                      ? 'bg-emerald-500 w-full'
                      : password.length >= 8
                        ? 'bg-amber-400 w-2/3'
                        : 'bg-rose-400 w-1/3'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  password.length >= 12
                    ? 'text-emerald-600'
                    : password.length >= 8
                      ? 'text-amber-600'
                      : 'text-rose-500'
                }`}
              >
                {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Fair' : 'Weak'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-200/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 ${
              !isFormValid || isSubmitting
                ? 'bg-indigo-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating…</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
