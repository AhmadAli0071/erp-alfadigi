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
      icon: <Ticket className="w-4 h-4 text-blue-400" />,
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/[0.04]',
      badgeBg: 'bg-blue-500/10 text-blue-300',
    },
    {
      id: 'pending',
      label: 'Pending Tickets',
      value: summary.pendingCount,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/[0.04]',
      badgeBg: 'bg-amber-500/10 text-amber-300',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: summary.inProgressCount,
      icon: <PlayCircle className="w-4 h-4 text-indigo-400" />,
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-500/[0.04]',
      badgeBg: 'bg-indigo-500/10 text-indigo-300',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: summary.resolvedCount,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/[0.04]',
      badgeBg: 'bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'closed',
      label: 'Closed',
      value: summary.closedCount,
      icon: <Archive className="w-4 h-4 text-slate-400" />,
      border: 'border-white/10',
      bg: 'bg-white/[0.02]',
      badgeBg: 'bg-white/10 text-slate-300',
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
            <span className="text-xs font-medium text-slate-400 truncate">{card.label}</span>
            <div className={`p-1.5 rounded-lg ${card.badgeBg}`}>
              {card.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {card.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
