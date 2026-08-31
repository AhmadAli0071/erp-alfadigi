import React from 'react';
import { Clock, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';

interface HRWorkingHoursCardProps {
  onNavigate: (route: string) => void;
}

export const HRWorkingHoursCard: React.FC<HRWorkingHoursCardProps> = ({ onNavigate }) => {
  return (
    <section
      className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-sm"
      aria-label="Working Hours Today"
      id="hr-working-hours-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Working Hours Today</h3>
            <p className="text-xs text-slate-400">Shift pace &amp; compliance progress</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/hr/attendance/overtime')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none cursor-pointer self-start sm:self-auto"
          id="view-working-hours-details-btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
        {/* Average Working Hours */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Average Working Hours</span>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">—</div>
          <span className="text-[10px] text-slate-400 font-medium">No data</span>
        </div>

        {/* Required */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Required</span>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-300 font-mono">8h</div>
          <span className="text-[10px] text-slate-400 font-medium">Standard baseline</span>
        </div>

        {/* Short Hours */}
        <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-400">Short Hours</span>
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">—</div>
          <span className="text-[10px] text-slate-400 font-medium">No data</span>
        </div>

        {/* Extra Hours Pending */}
        <div className="p-3.5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-400">Extra Hours Pending</span>
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-300 font-mono">—</div>
          <span className="text-[10px] text-slate-400 font-medium">No data</span>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Shift Progress</span>
          <span className="text-slate-400">No working-hours data available</span>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full rounded-full w-0" />
        </div>
      </div>
    </section>
  );
};

