import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { FormInput } from '../common/FormInput';
import { authService } from '../../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setEmailError('');
      setSuccessMessage(null);
      setIsSubmitting(false);
      // Auto focus after mount
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialEmail]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsSubmitting(true);
    try {
      const response = await authService.requestPasswordReset(email);
      setSuccessMessage(response.message);
    } catch {
      setEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
      id="forgot-password-modal"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 z-10 animate-scaleUp overflow-hidden text-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          aria-label="Close modal"
          id="close-forgot-password-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="forgot-password-modal-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              Reset your password
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          Enter your email address and we'll help you reset your password.
        </p>

        {/* Success State */}
        {successMessage ? (
          <div className="space-y-5 animate-fadeIn" id="reset-password-success-view">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-semibold block text-indigo-700 mb-1">
                  Simulation Notice
                </span>
                {successMessage}
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="font-medium text-slate-600">Target Address:</span>{' '}
              <span className="font-mono text-indigo-600">{email}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-3 focus:ring-indigo-500/30 cursor-pointer"
              id="close-success-modal-btn"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormInput
              ref={inputRef}
              id="reset-email-input"
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={() => {
                if (email) validateEmail(email);
              }}
              error={emailError}
              required
              disabled={isSubmitting}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-2 sm:order-1 px-5 py-3 rounded-xl border border-slate-200/80 bg-slate-100/60 hover:bg-slate-200/50 text-slate-600 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/70 cursor-pointer"
                id="cancel-reset-password-btn"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 order-1 sm:order-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 focus:outline-none focus:ring-3 focus:ring-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                id="send-reset-link-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

