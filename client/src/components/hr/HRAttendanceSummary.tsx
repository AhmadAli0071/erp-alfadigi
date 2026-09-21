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

  // Breakdown statistics derived from live dashboard KPIs
  const totalRoster = kpis.totalEmployees;
  const rosterDenominator = Math.max(1, totalRoster);
  const summaryItems = [
    { label: 'Present', count: kpis.presentToday, color: '#10b981', ringColor: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Absent', count: kpis.absentToday, color: '#f43f5e', ringColor: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'On Leave', count: kpis.onLeaveToday, color: '#3b82f6', ringColor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'WFH', count: kpis.workFromHomeToday, color: '#0ea5e9', ringColor: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Half Day', count: kpis.halfDayToday, color: '#a855f7', ringColor: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Late', count: kpis.lateOrShortHoursToday, color: '#f59e0b', ringColor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  const turnoutPct = totalRoster ? Math.round((kpis.presentToday / totalRoster) * 100) : 0;
  const coveragePct = (n: number) => `${(n / rosterDenominator) * 100}%`;

  // Overnight shift spans today (evening) → tomorrow (early morning)
  const shiftStartDay = new Date();
  const shiftEndDay = new Date();
  shiftEndDay.setDate(shiftEndDay.getDate() + 1);
  const fmtShiftDay = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;

  // Calculate SVG donut slice arcs
  let accumulatedAngle = 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="attendance-summary-section">
      {/* 1. Today's Attendance Visual & Donut Card (7 cols) */}
      <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Today's Attendance
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live shift attendance distribution across {totalRoster} staff members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/hr/attendance/today')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-600 flex items-center gap-1 focus:outline-none cursor-pointer"
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
                const strokeDash = (item.count / rosterDenominator) * circumference;
                const strokeOffset = circumference - strokeDash;
                const rotation = accumulatedAngle;
                accumulatedAngle += (item.count / rosterDenominator) * 360;

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
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {turnoutPct}%
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
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
                    ? 'bg-slate-200/50 border-slate-300/80 scale-[1.03]'
                    : `${item.bg} ${item.border}`
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-medium text-slate-600 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Footer Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Workforce Coverage</span>
            <span className="font-mono text-slate-900">{kpis.presentToday} Present / {totalRoster} Staff</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100/60 flex overflow-hidden gap-0.5">
            <div style={{ width: coveragePct(kpis.presentToday) }} className="bg-emerald-500 h-full" title={`Present (${turnoutPct}%)`} />
            <div style={{ width: coveragePct(kpis.absentToday) }} className="bg-rose-500 h-full" title={`Absent (${totalRoster ? Math.round((kpis.absentToday / totalRoster) * 100) : 0}%)`} />
            <div style={{ width: coveragePct(kpis.onLeaveToday) }} className="bg-blue-500 h-full" title={`On Leave (${totalRoster ? Math.round((kpis.onLeaveToday / totalRoster) * 100) : 0}%)`} />
            <div style={{ width: coveragePct(kpis.halfDayToday) }} className="bg-purple-500 h-full" title={`Half Day (${totalRoster ? Math.round((kpis.halfDayToday / totalRoster) * 100) : 0}%)`} />
          </div>
        </div>
      </div>

      {/* 2. Right Side: Company Shift Information & Extra Hours Alert (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Extra Hours Pending Verification Card (Section 23) */}
        <div className="bg-white/80 backdrop-blur-xl border border-amber-200 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  Extra Hours Pending Verification
                </h4>
                <p className="text-xs text-amber-600 font-medium">
                  Pre/post shift overtime requiring HR audit
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-600 border border-amber-200">
              Audit Alert
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Staff Detected</span>
              <span className="text-xl font-black text-slate-900">{kpis.pendingExtraHoursEmployeesCount} Employees</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Total Overtime</span>
              <span className="text-xl font-black text-amber-600 font-mono">{kpis.pendingExtraHoursTotalTime}</span>
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
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Company Shift
              </h4>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Standard Roster
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs my-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px]">Shift Window</span>
              <strong className="text-slate-900 text-xs font-semibold">6:00 PM – 3:00 AM</strong>
              <span className="text-[10px] text-slate-400 block">(9 Hours Span)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px]">Required Working</span>
              <strong className="text-slate-900 text-xs font-semibold">8 Hours</strong>
              <span className="text-[10px] text-slate-400 block">(Net of break)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px]">Weekend</span>
              <strong className="text-slate-900 text-xs font-semibold">Saturday &amp; Sunday</strong>
              <span className="text-[10px] text-slate-400 block">Non-working days</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px]">Break Rule</span>
              <strong className="text-indigo-600 text-xs font-semibold">Unlimited Break</strong>
              <span className="text-[10px] text-slate-400 block">Deducted from work time</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Overnight shift spans from {fmtShiftDay(shiftStartDay)} (evening) to {fmtShiftDay(shiftEndDay)} (early morning). Extra time before 6 PM or after 3 AM requires HR verification.
          </p>
        </div>
      </div>
    </div>
  );
};
