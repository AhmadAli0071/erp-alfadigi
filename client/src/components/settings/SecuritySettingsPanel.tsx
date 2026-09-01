import React from 'react';
import { SecuritySettings } from '../../types/settings';
import { Shield, KeyRound, Smartphone, Lock, AlertTriangle } from 'lucide-react';

interface SecuritySettingsPanelProps {
  settings: SecuritySettings;
  onChange: (updated: Partial<SecuritySettings>) => void;
}

export const SecuritySettingsPanel: React.FC<SecuritySettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6" id="settings-panel-security">
      <div className="border-b border-slate-200/70 pb-4">
        <h3 className="text-base font-semibold text-slate-900">Security & Access Policy Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Manage session life-cycle timeouts, authentication complexity standards, and brute-force lockout thresholds.
        </p>
      </div>

      <div className="space-y-4">
        {/* Two-Factor Auth */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100/60 border border-slate-200/80 shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-slate-900">Mandatory Two-Factor Authentication (2FA)</h4>
              <p className="text-[11px] text-slate-500">
                Enforce TOTP authenticator app verification for all HR Admin and managerial accounts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange({ requireTwoFactorAuth: !settings.requireTwoFactorAuth })}
            className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
              settings.requireTwoFactorAuth ? 'bg-indigo-600' : 'bg-slate-200/50'
            }`}
            id="toggle-require-2fa"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.requireTwoFactorAuth ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Session Timeout */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              Inactivity Session Timeout
            </div>
            <p className="text-[11px] text-slate-500">
              Automatically terminate and lock inactive portal sessions.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <input
              type="number"
              min={15}
              max={480}
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => onChange({ sessionTimeoutMinutes: Number(e.target.value) })}
              className="w-24 bg-slate-50/80 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500">Minutes</span>
          </div>
        </div>

        {/* Password Policy */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Password Complexity Rules
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Minimum Password Length</label>
              <input
                type="number"
                min={6}
                max={32}
                value={settings.passwordMinLength}
                onChange={(e) => onChange({ passwordMinLength: Number(e.target.value) })}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Special Characters & Symbols</label>
              <select
                value={settings.passwordRequireSpecialChar ? 'Required' : 'Optional'}
                onChange={(e) =>
                  onChange({ passwordRequireSpecialChar: e.target.value === 'Required' })
                }
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Required">Required (!@#$%^&*)</option>
                <option value="Optional">Optional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Lockout */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <Lock className="w-4 h-4 text-rose-600" />
            Brute-Force Account Lockout Protection
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Max Failed Login Attempts</label>
              <input
                type="number"
                min={3}
                max={10}
                value={settings.maxFailedLoginAttempts}
                onChange={(e) => onChange({ maxFailedLoginAttempts: Number(e.target.value) })}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600">Lockout Cooldown (Minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={settings.lockoutDurationMinutes}
                onChange={(e) => onChange({ lockoutDurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
