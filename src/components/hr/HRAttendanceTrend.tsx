import React, { useState } from 'react';
import { AttendanceTrendPoint } from '../../types/hr';
import { BarChart3, Calendar, TrendingUp, Info } from 'lucide-react';

interface HRAttendanceTrendProps {
  trendData: AttendanceTrendPoint[];
}

export const HRAttendanceTrend: React.FC<HRAttendanceTrendProps> = ({ trendData }) => {
  const [activeHoverPoint, setActiveHoverPoint] = useState<AttendanceTrendPoint | null>(null);

  const maxVal = 24; // Total workforce

  return (
    <div
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl space-y-4"
      aria-label="Attendance Trend Chart"
      id="attendance-trend-container"
    >
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Attendance Trend (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily turnout analysis across 24 workforce members
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 font-medium">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-600 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-600 font-medium">Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 border border-slate-300" />
            <span className="text-slate-400 font-medium">Weekend</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas & Bar Visualization */}
      <div className="relative pt-6 pb-2">
        {/* Dynamic Tooltip Float */}
        {activeHoverPoint && (
          <div className="absolute top-0 right-4 p-2 px-3 rounded-xl bg-white/95 backdrop-blur-md shadow-lg shadow-slate-300/40 border border-indigo-200 text-xs shadow-xl z-10 flex items-center gap-3 animate-fadeIn">
            <span className="font-bold text-slate-900">
              {activeHoverPoint.dayShort}, {activeHoverPoint.date}:
            </span>
            {!activeHoverPoint.isWeekend ? (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-emerald-600 font-bold">{activeHoverPoint.present} Present</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">{activeHoverPoint.absent} Absent</span>
                <span>•</span>
                <span className="text-blue-600 font-bold">{activeHoverPoint.leave} Leave</span>
              </div>
            ) : (
              <span className="text-slate-500 font-semibold italic">Weekend (Non-working)</span>
            )}
          </div>
        )}

        {/* 7-Day Grouped Column Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pt-8 px-2 border-b border-slate-200/80">
          {trendData.map((pt) => {
            const presentHeight = (pt.present / maxVal) * 100;
            const absentHeight = (pt.absent / maxVal) * 100;
            const leaveHeight = (pt.leave / maxVal) * 100;

            const isHovered = activeHoverPoint?.date === pt.date;

            return (
              <div
                key={pt.date}
                className="h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setActiveHoverPoint(pt)}
                onMouseLeave={() => setActiveHoverPoint(null)}
              >
                {!pt.isWeekend ? (
                  <div
                    className={`w-full max-w-[42px] flex items-end justify-center gap-1 p-1 rounded-t-xl transition-all duration-200 ${
                      isHovered ? 'bg-slate-100/70 ring-1 ring-indigo-500/30' : 'bg-slate-50'
                    }`}
                  >
                    {/* Present Bar */}
                    <div
                      style={{ height: `${presentHeight}%` }}
                      className="w-1/3 bg-emerald-500 hover:bg-emerald-500 rounded-t-sm transition-all duration-300 relative"
                      title={`Present: ${pt.present}`}
                    />
                    {/* Absent Bar */}
                    <div
                      style={{ height: `${absentHeight}%` }}
                      className="w-1/3 bg-rose-500 hover:bg-rose-500 rounded-t-sm transition-all duration-300 relative"
                      title={`Absent: ${pt.absent}`}
                    />
                    {/* Leave Bar */}
                    <div
                      style={{ height: `${leaveHeight}%` }}
                      className="w-1/3 bg-blue-500 hover:bg-blue-500 rounded-t-sm transition-all duration-300 relative"
                      title={`Leave: ${pt.leave}`}
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[42px] h-12 flex flex-col items-center justify-center rounded-t-xl bg-slate-50/50 border border-dashed border-slate-200/70 text-[9px] font-mono text-slate-700">
                    <span>OFF</span>
                  </div>
                )}

                {/* Day label below */}
                <div className="text-center mt-2.5 select-none">
                  <span className={`block text-xs font-bold ${isHovered ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {pt.dayShort}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400">
                    {pt.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
