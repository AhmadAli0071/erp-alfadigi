import React from 'react';
import { PieChart, Sparkles } from 'lucide-react';

interface HRLeaveDistributionCardProps {
  distribution: {
    casual: number;
    annual: number;
    sick: number;
    unpaid: number;
    other: number;
  };
  totalApprovedDays: number;
}

export const HRLeaveDistributionCard: React.FC<HRLeaveDistributionCardProps> = ({
  distribution,
  totalApprovedDays,
}) => {
  const totalItems =
    distribution.casual +
    distribution.annual +
    distribution.sick +
    distribution.unpaid +
    distribution.other;

  const safeTotal = totalItems > 0 ? totalItems : 1;

  const categories = [
    {
      label: 'Casual',
      count: distribution.casual,
      percentage: Math.round((distribution.casual / safeTotal) * 100),
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Annual',
      count: distribution.annual,
      percentage: Math.round((distribution.annual / safeTotal) * 100),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Sick',
      count: distribution.sick,
      percentage: Math.round((distribution.sick / safeTotal) * 100),
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Unpaid',
      count: distribution.unpaid,
      percentage: Math.round((distribution.unpaid / safeTotal) * 100),
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Other',
      count: distribution.other,
      percentage: Math.round((distribution.other / safeTotal) * 100),
      color: 'bg-sky-500',
      textColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 border-sky-500/20',
    },
  ];

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-[#0d0e12] border border-white/5 shadow-md flex flex-col justify-between"
      id="leave-distribution-card"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Leave Distribution
              </h3>
              <span className="text-[11px] text-slate-400">By category breakdown</span>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
            {totalItems} Requests
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5 mb-4">
          {categories.map((cat) =>
            cat.count > 0 ? (
              <div
                key={cat.label}
                className={`h-full ${cat.color} transition-all`}
                style={{ width: `${cat.percentage}%` }}
                title={`${cat.label}: ${cat.count} (${cat.percentage}%)`}
              />
            ) : null
          )}
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-full ${cat.color} shrink-0`} />
                <span className="text-slate-300 font-medium text-xs truncate">
                  {cat.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono">
                <span className="font-bold text-white">{cat.count}</span>
                <span className="text-[10px] text-slate-500">({cat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Approved Utilization:</span>
        <span className="font-mono font-bold text-emerald-400">
          {totalApprovedDays} Total Days
        </span>
      </div>
    </div>
  );
};
