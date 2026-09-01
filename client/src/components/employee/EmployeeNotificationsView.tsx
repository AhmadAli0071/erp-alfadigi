import React from 'react';
import { User } from '../../types/auth';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  BellOff,
} from 'lucide-react';

interface EmployeeNotificationsViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

export const EmployeeNotificationsView: React.FC<EmployeeNotificationsViewProps> = ({
  user,
  onNavigate,
}) => {
  const hasNotifications = false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="employee-notifications-view">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/employee/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500 font-medium">Stay updated on your requests</p>
          </div>
        </div>

        {hasNotifications && (
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {hasNotifications ? (
        <div className="space-y-3" />
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <BellOff className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No notifications</p>
          <p className="text-xs text-slate-400">You're all caught up! Notifications will appear here.</p>
        </div>
      )}
    </div>
  );
};
