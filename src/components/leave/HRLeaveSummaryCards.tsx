import React from 'react';
import { LeaveSummaryStats } from '../../types/leave';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';

interface HRLeaveSummaryCardsProps {
  stats: LeaveSummaryStats;
  currentStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const HRLeaveSummaryCards: React.FC<HRLeaveSummaryCardsProps> = ({
  stats,
  currentStatusFilter,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'total',
      title: 'Total Requests',
      value: stats.totalRequests,
      statusKey: 'ALL',
      subtitle: 'All requests in selected period',
      icon: <FileText className="w-4 h-4 text-indigo-600" />,
      activeBorder: 'border-indigo-300 bg-indigo-50',
      inactiveBorder: 'border-slate-200/70 hover:border-indigo-200 hover:bg-slate-50',
      valueColor: 'text-slate-900',
      badge: 'All',
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      id: 'pending',
      title: 'Pending',
      value: stats.pending,
      statusKey: 'Pending',
      subtitle: 'Waiting for HR action',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      activeBorder: 'border-amber-300 bg-amber-50',
      inactiveBorder: 'border-slate-200/70 hover:border-amber-200 hover:bg-slate-50',
      valueColor: 'text-amber-600',
      badge: 'Action Needed',
      badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'approved',
      title: 'Approved',
      value: stats.approved,
      statusKey: 'Approved',
      subtitle: 'Authorized leaves',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      activeBorder: 'border-emerald-300 bg-emerald-50',
      inactiveBorder: 'border-slate-200/70 hover:border-emerald-200 hover:bg-slate-50',
      valueColor: 'text-emerald-600',
      badge: `${stats.totalDaysApproved} Days Total`,
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'rejected',
      title: 'Rejected',
      value: stats.rejected,
      statusKey: 'Rejected',
      subtitle: 'Declined requests',
      icon: <XCircle className="w-4 h-4 text-rose-600" />,
      activeBorder: 'border-rose-300 bg-rose-50',
      inactiveBorder: 'border-slate-200/70 hover:border-rose-200 hover:bg-slate-50',
      valueColor: 'text-rose-600',
      badge: 'Declined',
      badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      id: 'on_leave',
      title: 'Employees On Leave',
      value: stats.employeesOnLeaveToday,
      statusKey: 'ON_LEAVE_TODAY',
      subtitle: 'Currently absent today',
      icon: <UserCheck className="w-4 h-4 text-sky-600" />,
      activeBorder: 'border-sky-300 bg-sky-50',
      inactiveBorder: 'border-slate-200/70 hover:border-sky-200 hover:bg-slate-50',
      valueColor: 'text-sky-600',
      badge: 'Active Today',
      badgeColor: 'bg-sky-50 text-sky-600 border-sky-200',
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      id="leave-summary-cards"
    >
      {cards.map((card) => {
        const isSelected =
          card.statusKey === 'ON_LEAVE_TODAY'
            ? false
            : currentStatusFilter === card.statusKey;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              if (card.statusKey === 'ON_LEAVE_TODAY') {
                onSelectStatusFilter('Approved');
              } else {
                onSelectStatusFilter(card.statusKey);
              }
            }}
            className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              isSelected ? card.activeBorder : card.inactiveBorder
            } bg-slate-50 shadow-sm`}
            id={`leave-card-${card.id}`}
          >
            {/* Header row inside card */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 truncate">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100/60 border border-slate-200/70 shrink-0">
                {card.icon}
              </div>
            </div>

            {/* Metric Value */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${card.valueColor}`}
              >
                {card.value}
              </span>
            </div>

            {/* Footer / Badge */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">{card.subtitle}</span>
            </div>

            {isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};
