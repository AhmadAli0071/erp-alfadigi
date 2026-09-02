import React from 'react';
import { User } from '../../types/auth';
import { ClockButtonsCard } from '../attendance/ClockButtonsCard';
import {
  Clock,
  CalendarDays,
  Ticket,
  ArrowRight,
} from 'lucide-react';

interface EmployeeDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ user, onNavigate }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* Clock Buttons Card (shared) */}
      <ClockButtonsCard user={user} />

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'View Attendance', icon: <Clock className="w-4 h-4" />, route: '/employee/attendance', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { label: 'Request Leave', icon: <CalendarDays className="w-4 h-4" />, route: '/employee/leaves', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Create Ticket', icon: <Ticket className="w-4 h-4" />, route: '/employee/tickets', color: 'text-rose-600 bg-rose-50 border-rose-200' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.route)}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${action.color}`}>
                  {action.icon}
                </div>
                <span className="text-xs font-bold text-slate-700">{action.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
