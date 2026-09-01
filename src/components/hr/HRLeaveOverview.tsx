import React from 'react';
import { LeaveOverviewCategory } from '../../types/hr';
import { CalendarDays, ArrowRight, PieChart } from 'lucide-react';

interface HRLeaveOverviewProps {
  leaveData: LeaveOverviewCategory[];
  onNavigate: (route: string) => void;
}

export const HRLeaveOverview: React.FC<HRLeaveOverviewProps> = ({ leaveData, onNavigate }) => {
  return (
    <div
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl space-y-5"
      aria-label="Leave Overview & Balances"
      id="hr-leave-overview-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Leave Overview
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Company-wide leave utilization and balance quota status
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/hr/leaves/balances')}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-100/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
          id="view-leave-balances-btn"
        >
          <span>View Leave Balances</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Leave Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveData.map((category) => {
          const usagePercent =
            category.allocated > 0
              ? Math.min(100, Math.round((category.used / category.allocated) * 100))
              : category.used > 0
              ? 100
              : 0;

          return (
            <div
              key={category.type}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-200/80 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{category.type}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100/60 px-2 py-0.5 rounded">
                  {usagePercent}% utilized
                </span>
              </div>

              {/* Metric Counts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-500 block">Used</span>
                  <span className="text-base font-black text-slate-900">{category.used}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-500 block">Pending</span>
                  <span className="text-base font-black text-amber-600">{category.pending}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100/60 h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${usagePercent}%` }}
                  className={`h-full rounded-full ${category.colorClass}`}
                />
              </div>

              {category.allocated > 0 && (
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Available: {category.available}</span>
                  <span>Total: {category.allocated}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
