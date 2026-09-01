import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to load HR dashboard data.',
  onRetry,
}) => {
  return (
    <div
      className="p-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-rose-200 text-center space-y-4 max-w-lg mx-auto shadow-2xl my-12"
      id="hr-dashboard-error-state"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Connection Issue
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {message} Please verify your connection or retry loading the dashboard metrics.
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          id="error-retry-btn"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      )}
    </div>
  );
};
