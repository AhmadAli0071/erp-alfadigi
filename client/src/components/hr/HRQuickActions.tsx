import React from 'react';
import { UserPlus, Clock, CalendarDays, Ticket, Zap } from 'lucide-react';

interface HRQuickActionsProps {
  onNavigate: (route: string) => void;
}

export const HRQuickActions: React.FC<HRQuickActionsProps> = ({ onNavigate }) => {
  // Exactly 4 compact action buttons
  const shortcuts = [
    {
      id: 'quick-add-employee',
      label: 'Add Employee',
      icon: <UserPlus className="w-4 h-4 text-indigo-600" />,
      route: '/hr/employees',
      hoverBorder: 'hover:border-indigo-200 hover:bg-indigo-500/[0.04]',
    },
    {
      id: 'quick-today-attendance',
      label: "Today's Attendance",
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      route: '/hr/attendance/today',
      hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-500/[0.04]',
    },
    {
      id: 'quick-leave-requests',
      label: 'Leave Requests',
      icon: <CalendarDays className="w-4 h-4 text-blue-600" />,
      route: '/hr/leaves/requests',
      hoverBorder: 'hover:border-blue-300 hover:bg-blue-500/[0.04]',
    },
    {
      id: 'quick-tickets',
      label: 'Tickets',
      icon: <Ticket className="w-4 h-4 text-purple-600" />,
      route: '/hr/tickets',
      hoverBorder: 'hover:border-purple-300 hover:bg-purple-500/[0.04]',
    },
  ];

  return (
    <section aria-label="Quick Actions" id="hr-quick-actions-bar">
      <div className="flex items-center gap-2 mb-2.5">
        <Zap className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shortcuts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.route)}
            className={`p-3 rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200/80 text-left transition-all flex items-center gap-3 group cursor-pointer ${item.hoverBorder}`}
            id={item.id}
          >
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
