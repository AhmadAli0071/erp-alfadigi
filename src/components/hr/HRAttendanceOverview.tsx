import React from 'react';
import { Clock, ArrowRight, UserCheck, UserX, CalendarDays, Home } from 'lucide-react';
import { AttendanceRecord } from '../../types/hr';

interface HRAttendanceOverviewProps {
  attendanceRecords?: AttendanceRecord[];
  onNavigate: (route: string) => void;
}

export const HRAttendanceOverview: React.FC<HRAttendanceOverviewProps> = ({
  attendanceRecords = [],
  onNavigate,
}) => {
  const totalEmployees = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Pending OT').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = attendanceRecords.filter((r) => r.status === 'Leave' || r.status === 'Half Day').length;
  const wfhCount = attendanceRecords.filter((r) => r.status === 'Work From Home').length;

  const hasData = totalEmployees > 0;
  const turnoutRate = hasData ? Math.round((presentCount / totalEmployees) * 100) : null;

  const radius = 62;

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      aria-label="Attendance Overview"
      id="hr-attendance-overview"
    >
      {/* LEFT: Today's Attendance Donut Chart (7 cols) */}
      <div className="lg:col-span-7 bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Today's Attendance</h3>
              <p className="text-xs text-slate-400">Live roster distribution</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Shift: 6 PM – 3 AM
          </span>
        </div>

        {/* Donut Chart & Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-4">
          {/* SVG Donut Center */}
          <div className="sm:col-span-6 flex flex-col items-center justify-center relative py-2">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/5"
                strokeWidth="14"
                fill="transparent"
              />
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-black text-white tracking-tight">
                {hasData ? totalEmployees : '—'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Employees
              </span>
            </div>
          </div>

          {/* Quick Legend & Status Pills */}
          <div className="sm:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-300">Present</span>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                {hasData ? presentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-slate-300">Absent</span>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                {hasData ? absentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-slate-300">Leave</span>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                {hasData ? leaveCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-medium text-slate-300">WFH</span>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                {hasData ? wfhCount : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Under the chart metric */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Workforce Turnout</span>
          <span className="font-semibold text-slate-400">
            {hasData && turnoutRate !== null ? `Present: ${turnoutRate}%` : 'No attendance data available'}
          </span>
        </div>
      </div>

      {/* RIGHT: Attendance Summary (5 cols) */}
      <div className="lg:col-span-5 bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight">Attendance Summary</h3>
            <span className="text-xs text-slate-400">Today</span>
          </div>

          {/* 4 Compact Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">Present</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {hasData ? presentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/20">
              <div className="flex items-center gap-2.5">
                <UserX className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-medium text-slate-200">Absent</span>
              </div>
              <span className="text-sm font-bold text-rose-400 font-mono">
                {hasData ? absentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/20">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-200">On Leave</span>
              </div>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {hasData ? leaveCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/[0.04] border border-sky-500/20">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-medium text-slate-200">WFH</span>
              </div>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {hasData ? wfhCount : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* View Attendance Button */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => onNavigate('/hr/attendance/today')}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="view-attendance-btn"
          >
            <span>View Attendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};

