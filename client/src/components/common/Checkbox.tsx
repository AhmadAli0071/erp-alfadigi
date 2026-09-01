import React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled,
  className = '',
  ...props
}) => {
  const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      id={`${checkboxId}-wrapper`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className="w-4 h-4 rounded-md border border-slate-300/70 bg-slate-100/50 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-focus-visible:ring-3 peer-focus-visible:ring-indigo-500/30 peer-focus-visible:border-indigo-500 hover:border-slate-300"
          aria-hidden="true"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity mx-auto my-auto"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
        </div>
      </div>
      <span className="text-xs sm:text-sm">{label}</span>
    </label>
  );
};

