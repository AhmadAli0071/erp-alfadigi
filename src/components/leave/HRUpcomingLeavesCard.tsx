import React from 'react';
import { LeaveRequest } from '../../types/leave';
import { CalendarDays, ArrowRight } from 'lucide-react';

interface HRUpcomingLeavesCardProps {
  upcomingLeaves: LeaveRequest[];
  onViewRequest: (request: LeaveRequest) => void;
  onViewCalendar: () => void;
}

export const HRUpcomingLeavesCard: React.FC<HRUpcomingLeavesCardProps> = ({
  upcomingLeaves,
  onViewRequest,
  onViewCalendar,
}) => {
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-[#0d0e12] border border-white/5 shadow-md flex flex-col justify-between"
      id="upcoming-leaves-card"
    >
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Upcoming Leaves
              </h3>
              <span className="text-[11px] text-slate-400">Next approved leaves</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewCalendar}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Calendar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {upcomingLeaves.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No upcoming approved leaves in roster.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingLeaves.slice(0, 4).map((leave) => (
              <div
                key={leave.id}
                onClick={() => onViewRequest(leave)}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {leave.employeeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      {leave.employeeName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {leave.leaveType}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono font-bold text-indigo-300 block">
                    {leave.startDateDisplay.slice(0, 6)} – {leave.endDateDisplay.slice(0, 6)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={onViewCalendar}
          className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-center font-semibold transition-colors cursor-pointer"
        >
          Open Calendar View
        </button>
      </div>
    </div>
  );
};
