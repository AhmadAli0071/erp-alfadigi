import React from 'react';
import { HRDashboardKPIs } from '../../types/hr';
import {
  Users,
  UserCheck,
  CalendarDays,
  UserX,
  AlertCircle,
  Ticket,
  ArrowUpRight,
} from 'lucide-react';

interface HRKpiGridProps {
  kpis?: HRDashboardKPIs;
  onSelectKpiFilter?: (filterKey: string) => void;
}

export const HRKpiGrid: React.FC<HRKpiGridProps> = ({ kpis, onSelectKpiFilter }) => {
  const formatValue = (val?: number) => {
    return val !== undefined && val !== null && val > 0 ? val : '—';
  };

  // Exactly 6 primary KPI cards
  const cards = [
    {
      id: 'kpi-total-employees',
      title: 'Total Employees',
      value: formatValue(kpis?.totalEmployees),
      context: 'All departments',
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      tag: { label: 'Active', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
      filterKey: '/hr/employees',
    },
    {
      id: 'kpi-present-today',
      title: 'Present Today',
      value: formatValue(kpis?.presentToday),
      context: 'On duty',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      tag: { label: 'On Duty', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
      filterKey: '/hr/attendance/today',
    },
    {
      id: 'kpi-on-leave',
      title: 'On Leave',
      value: formatValue(kpis?.onLeaveToday),
      context: 'Approved today',
      icon: <CalendarDays className="w-5 h-5 text-blue-600" />,
      tag: { label: 'Approved', color: 'bg-blue-50 text-blue-600 border-blue-200' },
      filterKey: '/hr/leaves/requests',
    },
    {
      id: 'kpi-absent',
      title: 'Absent',
      value: formatValue(kpis?.absentToday),
      context: 'Unplanned absence',
      icon: <UserX className="w-5 h-5 text-rose-600" />,
      tag: { label: 'Action Needed', color: 'bg-rose-50 text-rose-600 border-rose-200' },
      filterKey: '/hr/attendance/today',
    },
    {
      id: 'kpi-pending-requests',
      title: 'Pending Requests',
      value: formatValue(kpis?.pendingRequestsCount),
      context: 'Leaves & corrections',
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      tag: { label: 'HR Action', color: 'bg-amber-50 text-amber-600 border-amber-200' },
      filterKey: 'PENDING_ACTIONS',
    },
    {
      id: 'kpi-pending-tickets',
      title: 'Pending Tickets',
      value: formatValue(kpis?.pendingTicketsCount),
      context: 'Helpdesk queries',
      icon: <Ticket className="w-5 h-5 text-purple-600" />,
      tag: { label: 'In Review', color: 'bg-purple-50 text-purple-600 border-purple-200' },
      filterKey: '/hr/tickets',
    },
  ];

  return (
    <section aria-label="Primary Key Performance Indicators" id="hr-kpi-grid">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onSelectKpiFilter && onSelectKpiFilter(card.filterKey)}
            className="group p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            id={card.id}
          >
            {/* Top row: Icon & Tag */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-2 rounded-xl bg-slate-100/50 border border-slate-200/70 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                {card.icon}
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.tag.color}`}
              >
                {card.tag.label}
              </span>
            </div>

            {/* Middle: Big Number */}
            <div className="my-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline justify-between">
                <span>{card.value}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 opacity-0 group-hover:opacity-100" />
              </div>
            </div>

            {/* Bottom: Title & Context */}
            <div className="mt-1 pt-1 border-t border-slate-200/70">
              <h3 className="text-xs font-bold text-slate-700 truncate">{card.title}</h3>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                {card.context}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
