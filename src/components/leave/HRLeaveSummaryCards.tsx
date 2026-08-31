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
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      activeBorder: 'border-indigo-500/50 bg-indigo-500/10',
      inactiveBorder: 'border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.03]',
      valueColor: 'text-white',
      badge: 'All',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'pending',
      title: 'Pending',
      value: stats.pending,
      statusKey: 'Pending',
      subtitle: 'Waiting for HR action',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      activeBorder: 'border-amber-500/50 bg-amber-500/10',
      inactiveBorder: 'border-white/5 hover:border-amber-500/30 hover:bg-white/[0.03]',
      valueColor: 'text-amber-400',
      badge: 'Action Needed',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    {
      id: 'approved',
      title: 'Approved',
      value: stats.approved,
      statusKey: 'Approved',
      subtitle: 'Authorized leaves',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      activeBorder: 'border-emerald-500/50 bg-emerald-500/10',
      inactiveBorder: 'border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.03]',
      valueColor: 'text-emerald-400',
      badge: `${stats.totalDaysApproved} Days Total`,
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'rejected',
      title: 'Rejected',
      value: stats.rejected,
      statusKey: 'Rejected',
      subtitle: 'Declined requests',
      icon: <XCircle className="w-4 h-4 text-rose-400" />,
      activeBorder: 'border-rose-500/50 bg-rose-500/10',
      inactiveBorder: 'border-white/5 hover:border-rose-500/30 hover:bg-white/[0.03]',
      valueColor: 'text-rose-400',
      badge: 'Declined',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    {
      id: 'on_leave',
      title: 'Employees On Leave',
      value: stats.employeesOnLeaveToday,
      statusKey: 'ON_LEAVE_TODAY',
      subtitle: 'Currently absent today',
      icon: <UserCheck className="w-4 h-4 text-sky-400" />,
      activeBorder: 'border-sky-500/50 bg-sky-500/10',
      inactiveBorder: 'border-white/5 hover:border-sky-500/30 hover:bg-white/[0.03]',
      valueColor: 'text-sky-400',
      badge: 'Active Today',
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
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
            } bg-[#111217] shadow-sm`}
            id={`leave-card-${card.id}`}
          >
            {/* Header row inside card */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400 truncate">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 shrink-0">
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
            <div className="flex items-center justify-between text-[11px] text-slate-400">
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
