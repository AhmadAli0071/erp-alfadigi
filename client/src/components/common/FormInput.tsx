import React, { forwardRef } from 'react';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      error,
      leftIcon,
      rightElement,
      className = '',
      containerClassName = '',
      helperText,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`} id={`${inputId}-group`}>
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-600 tracking-tight ml-0.5"
            id={`${inputId}-label`}
          >
            {label}
            {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
          </label>
        </div>

        <div className="relative rounded-xl group transition-all">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`glass-input w-full text-base sm:text-sm font-normal rounded-xl py-3 text-slate-900 placeholder:text-slate-700 transition duration-150 ease-in-out focus:outline-none ${
              leftIcon ? 'pl-11' : 'pl-3.5'
            } ${rightElement ? 'pr-11' : 'pr-3.5'} ${
              error
                ? '!border-rose-300 !bg-rose-50/50 text-rose-700 focus:!border-rose-500 focus:!ring-rose-500/20'
                : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            className="text-xs font-medium text-rose-600 flex items-center gap-1.5 mt-1 ml-0.5 animate-fadeIn"
            role="alert"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0 text-rose-600"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-10a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-400 mt-0.5 ml-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

