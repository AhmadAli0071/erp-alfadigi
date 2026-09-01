import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { FormInput } from '../common/FormInput';
import { Checkbox } from '../common/Checkbox';
import { BrandLogo } from '../common/BrandLogo';
import { authService, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../services/authService';
import { DemoUserAccount, User } from '../../types/auth';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onOpenForgotPassword: (initialEmail: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onOpenForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field interaction & validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Track field touch to avoid premature errors
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Load remembered email on mount if available
  useEffect(() => {
    const remembered = authService.getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const validateEmailFormat = (val: string): boolean => {
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

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Please enter your password.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (email) {
      validateEmailFormat(email);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (password) {
      validatePassword(password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    setEmailTouched(true);
    setPasswordTouched(true);

    const isEmailValid = validateEmailFormat(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
        rememberMe,
      });

      if (response.success && response.user) {
        onLoginSuccess(response.user);
      } else {
        setAuthError(response.error || 'Invalid email or password. Please try again.');
      }
    } catch {
      setAuthError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill demo user credentials for effortless testability
  const handleQuickFill = (account: DemoUserAccount) => {
    setEmail(account.email);
    setPassword(account.demoPasswordHint);
    setEmailTouched(true);
    setPasswordTouched(true);
    setEmailError('');
    setPasswordError('');
    setAuthError('');
  };

  return (
    <div
      className="w-full max-w-md mx-auto px-4 py-8 sm:px-0"
      id="login-form-container"
    >
      {/* Mobile-Only Header Brand Logo */}
      <div className="lg:hidden flex items-center justify-center mb-8">
        <BrandLogo size="md" showTagline />
      </div>

      {/* Main Login Card / Section */}
      <div className="relative">
        {/* Form Title & Subtitle */}
        <div className="mb-8" id="login-header">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm font-normal text-slate-500 mt-2 leading-relaxed">
            Please enter your enterprise credentials to access your account.
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div
            className="mb-6 p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-700 flex items-start gap-3 text-xs sm:text-sm animate-fadeIn"
            role="alert"
            id="auth-error-banner"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-800">Authentication Failed</span>
              {authError}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate id="login-form">
          {/* Email Address Input */}
          <FormInput
            id="login-email-input"
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
              if (authError) setAuthError('');
            }}
            onBlur={handleEmailBlur}
            error={emailTouched ? emailError : undefined}
            required
            disabled={isLoading}
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {/* Password Input with Accessible Show/Hide Toggle */}
          <FormInput
            id="login-password-input"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
              if (authError) setAuthError('');
            }}
            onBlur={handlePasswordBlur}
            error={passwordTouched ? passwordError : undefined}
            required
            disabled={isLoading}
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Password visible. Click to hide password' : 'Password hidden. Click to show password'}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                id="toggle-password-visibility-btn"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            }
          />

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1">
            <Checkbox
              id="remember-me-checkbox"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />

            <button
              type="button"
              onClick={() => onOpenForgotPassword(email)}
              disabled={isLoading}
              className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-600 transition-colors focus:outline-none focus:underline rounded"
              id="forgot-password-link-btn"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Primary Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-2 focus:outline-none focus:ring-3 focus:ring-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              id="sign-in-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Enterprise Demo Account Quick-Fill Toolbar */}
        <div className="mt-8 pt-6 border-t border-slate-200/70" id="demo-accounts-picker">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Demo Accounts (Role Redirection)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100/60 border border-slate-200/70 px-2 py-0.5 rounded">
              Pass: {DEMO_PASSWORD}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Select an account to auto-fill credentials and test role redirection:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickFill(acc)}
                disabled={isLoading}
                className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200/70 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                id={`demo-user-fill-${acc.role.toLowerCase()}-${acc.department?.toLowerCase() || 'global'}`}
                title={`Click to fill ${acc.name} (${acc.role})`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                    {acc.roleDisplayName}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                  {acc.email}
                </span>
                {acc.department && (
                  <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                    Dept: {acc.department}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance / Security Footnote */}
      <div className="mt-8 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected by Enterprise Zero-Trust &amp; Role-Based Access Control</span>
        </p>
      </div>
    </div>
  );
};

