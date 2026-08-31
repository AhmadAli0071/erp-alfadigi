import React, { useState } from 'react';
import { HRDashboardKPIs } from '../../types/hr';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Home,
  Sun,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface HRAttendanceSummaryProps {
  kpis: HRDashboardKPIs;
  onNavigate: (route: string) => void;
  onFilterStatus?: (status: string) => void;
}

export const HRAttendanceSummary: React.FC<HRAttendanceSummaryProps> = ({
  kpis,
  onNavigate,
  onFilterStatus,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Breakdown statistics for 24 employees
  const summaryItems = [
    { label: 'Present', count: 18, color: '#10b981', ringColor: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Absent', count: 3, color: '#f43f5e', ringColor: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'On Leave', count: 2, color: '#3b82f6', ringColor: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'WFH', count: 2, color: '#0ea5e9', ringColor: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { label: 'Half Day', count: 1, color: '#a855f7', ringColor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Late', count: 4, color: '#f59e0b', ringColor: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  // Calculate SVG donut slice arcs
  const totalRoster = 24;
  let accumulatedAngle = 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="attendance-summary-section">
      {/* 1. Today's Attendance Visual & Donut Card (7 cols) */}
      <div className="lg:col-span-7 bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Today's Attendance
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Live shift attendance distribution across 24 staff members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/hr/attendance/today')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none cursor-pointer"
          >
            <span>View Detailed Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Donut & Interactive Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Donut Chart SVG (5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center relative py-2">
            <svg
              className="w-40 h-40 transform -rotate-90"
              viewBox="0 0 160 160"
            >
              {/* Background Track Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/5"
                strokeWidth="16"
                fill="transparent"
              />

              {/* Segments */}
              {summaryItems.map((item) => {
                const strokeDash = (item.count / totalRoster) * circumference;
                const strokeOffset = circumference - strokeDash;
                const rotation = accumulatedAngle;
                accumulatedAngle += (item.count / totalRoster) * 360;

                const isHovered = hoveredSegment === item.label;

                return (
                  <circle
                    key={item.label}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={item.color}
                    strokeWidth={isHovered ? 20 : 16}
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeDashoffset={-((rotation / 360) * circumference)}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(item.label)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white tracking-tight">
                75%
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Turnout
              </span>
            </div>
          </div>

          {/* Quick Segment Metric Pills (7 cols) */}
          <div className="sm:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredSegment(item.label)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onFilterStatus && onFilterStatus(item.label)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredSegment === item.label
                    ? 'bg-white/10 border-white/20 scale-[1.03]'
                    : `${item.bg} ${item.border}`
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-medium text-slate-300 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="text-lg font-black text-white">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Footer Progress Bar */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Workforce Coverage</span>
            <span className="font-mono text-white">18 Present / 24 Staff</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 flex overflow-hidden gap-0.5">
            <div style={{ width: '75%' }} className="bg-emerald-500 h-full" title="Present (75%)" />
            <div style={{ width: '12.5%' }} className="bg-rose-500 h-full" title="Absent (12.5%)" />
            <div style={{ width: '8.3%' }} className="bg-blue-500 h-full" title="On Leave (8.3%)" />
            <div style={{ width: '4.2%' }} className="bg-purple-500 h-full" title="Half Day (4.2%)" />
          </div>
        </div>
      </div>

      {/* 2. Right Side: Company Shift Information & Extra Hours Alert (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Extra Hours Pending Verification Card (Section 23) */}
        <div className="bg-[#121318] border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Extra Hours Pending Verification
                </h4>
                <p className="text-xs text-amber-300/80 font-medium">
                  Pre/post shift overtime requiring HR audit
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Audit Alert
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Staff Detected</span>
              <span className="text-xl font-black text-white">3 Employees</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Total Overtime</span>
              <span className="text-xl font-black text-amber-400 font-mono">1h 05m</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/hr/attendance/overtime')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            id="review-overtime-btn"
          >
            <span>Review Overtime</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Company Shift Info Card (Section 20 & 21) */}
        <div className="bg-[#121318] border border-white/10 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Current Company Shift
              </h4>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Standard Roster
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs my-3">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Shift Window</span>
              <strong className="text-white text-xs font-semibold">6:00 PM – 3:00 AM</strong>
              <span className="text-[10px] text-slate-500 block">(9 Hours Span)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Required Working</span>
              <strong className="text-white text-xs font-semibold">8 Hours</strong>
              <span className="text-[10px] text-slate-500 block">(Net of break)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Weekend</span>
              <strong className="text-white text-xs font-semibold">Saturday &amp; Sunday</strong>
              <span className="text-[10px] text-slate-500 block">Non-working days</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 block text-[10px]">Break Rule</span>
              <strong className="text-indigo-300 text-xs font-semibold">Unlimited Break</strong>
              <span className="text-[10px] text-slate-500 block">Deducted from work time</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Overnight shift spans from 31 Aug (evening) to 01 Sep (early morning). Extra time before 6 PM or after 3 AM requires HR verification.
          </p>
        </div>
      </div>
    </div>
  );
};
