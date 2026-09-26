import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ChangePasswordCard } from './ChangePasswordCard';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose, onSaved }) => {
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-fadeIn">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-900">
              {saved ? 'Password Changed' : 'Change Your Password'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {saved
                ? 'Your new password is active. Use it from your next login.'
                : 'You are using a default password provided by the company. Set your own password to secure your account.'}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <ChangePasswordCard
            onSaved={(msg) => {
              setSaved(true);
              onSaved?.(msg);
              setTimeout(() => {
                onClose();
              }, 2200);
            }}
          />
        </div>

        {!saved && (
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              I will do it later
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400 font-medium">
              This reminder will appear on every login until you change your password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
