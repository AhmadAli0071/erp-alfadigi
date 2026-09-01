import React from 'react';
import { Clock, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';

interface HRWorkingHoursCardProps {
  onNavigate: (route: string) => void;
}

export const HRWorkingHoursCard: React.FC<HRWorkingHoursCardProps> = ({ onNavigate }) => {
  return (
    <section
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm"
      aria-label="Working Hours Today"
      id="hr-working-hours-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Working Hours Today</h3>
            <p className="text-xs text-slate-500">Shift pace &amp; compliance progress</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/hr/attendance/overtime')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-600 flex items-center gap-1 focus:outline-none cursor-pointer self-start sm:self-auto"
          id="view-working-hours-details-btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
        {/* Average Working Hours */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Average Working Hours</span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">—</div>
          <span className="text-[10px] text-slate-500 font-medium">No data</span>
        </div>

        {/* Required */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Required</span>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 font-mono">8h</div>
          <span className="text-[10px] text-slate-500 font-medium">Standard baseline</span>
        </div>

        {/* Short Hours */}
        <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Short Hours</span>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono">—</div>
          <span className="text-[10px] text-slate-500 font-medium">No data</span>
        </div>

        {/* Extra Hours Pending */}
        <div className="p-3.5 rounded-xl bg-indigo-500/[0.04] border border-indigo-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Extra Hours Pending</span>
            <Sparkles className="w-3 h-3 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 font-mono">—</div>
          <span className="text-[10px] text-slate-500 font-medium">No data</span>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Shift Progress</span>
          <span className="text-slate-500">No working-hours data available</span>
        </div>
        <div className="w-full bg-slate-100/60 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full rounded-full w-0" />
        </div>
      </div>
    </section>
  );
};

