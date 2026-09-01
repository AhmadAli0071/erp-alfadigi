import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { HRActivityItem } from '../../types/hr';

interface HRRecentActivityProps {
  activities?: HRActivityItem[];
  onViewAll?: () => void;
}

export const HRRecentActivity: React.FC<HRRecentActivityProps> = ({
  activities = [],
  onViewAll,
}) => {
  return (
    <section
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
      aria-label="Recent Activity Log"
      id="recent-activity-container"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-slate-500">Latest workforce event log</p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-600 flex items-center gap-1 focus:outline-none cursor-pointer"
            id="view-all-activity-btn"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity Content: Empty State or Items */}
      {activities.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
            <Activity className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-xs font-semibold text-slate-600">No recent activity</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Workforce event logs will appear here once recorded.</p>
        </div>
      ) : (
        <div className="space-y-3.5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200/50 my-3">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 pl-6 group">
              {/* Timeline Dot */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white/80 backdrop-blur-xl border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Event Description & Time */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                  {act.title}
                </span>
                <span className="text-[11px] font-medium text-slate-400 shrink-0 font-mono">
                  {act.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

