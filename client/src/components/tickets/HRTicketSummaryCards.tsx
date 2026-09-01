import React from 'react';
import { TicketSummaryKPIs } from '../../types/ticket';
import {
  Ticket,
  Clock,
  PlayCircle,
  CheckCircle2,
  Archive,
} from 'lucide-react';

interface HRTicketSummaryCardsProps {
  summary: TicketSummaryKPIs;
  isLoading?: boolean;
}

export const HRTicketSummaryCards: React.FC<HRTicketSummaryCardsProps> = ({
  summary,
  isLoading = false,
}) => {
  const cards = [
    {
      id: 'open',
      label: 'Open Tickets',
      value: summary.openCount,
      icon: <Ticket className="w-4 h-4 text-blue-600" />,
      border: 'border-blue-200',
      bg: 'bg-blue-500/[0.04]',
      badgeBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'pending',
      label: 'Pending Tickets',
      value: summary.pendingCount,
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      border: 'border-amber-200',
      bg: 'bg-amber-500/[0.04]',
      badgeBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: summary.inProgressCount,
      icon: <PlayCircle className="w-4 h-4 text-indigo-600" />,
      border: 'border-indigo-200',
      bg: 'bg-indigo-500/[0.04]',
      badgeBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: summary.resolvedCount,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      border: 'border-emerald-200',
      bg: 'bg-emerald-500/[0.04]',
      badgeBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'closed',
      label: 'Closed',
      value: summary.closedCount,
      icon: <Archive className="w-4 h-4 text-slate-500" />,
      border: 'border-slate-200/80',
      bg: 'bg-slate-50',
      badgeBg: 'bg-slate-200/50 text-slate-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="hr-ticket-summary-cards">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`p-4 rounded-xl border ${card.border} ${card.bg} backdrop-blur-sm flex flex-col justify-between transition-all`}
          id={`ticket-summary-${card.id}`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-slate-500 truncate">{card.label}</span>
            <div className={`p-1.5 rounded-lg ${card.badgeBg}`}>
              {card.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-slate-200/50 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {card.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
