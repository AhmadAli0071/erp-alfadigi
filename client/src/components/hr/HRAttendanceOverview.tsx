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
      <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Today's Attendance</h3>
              <p className="text-xs text-slate-500">Live roster distribution</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
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
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {hasData ? totalEmployees : '—'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Employees
              </span>
            </div>
          </div>

          {/* Quick Legend & Status Pills */}
          <div className="sm:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Present</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {hasData ? presentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-slate-600">Absent</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {hasData ? absentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-slate-600">Leave</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {hasData ? leaveCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-medium text-slate-600">WFH</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {hasData ? wfhCount : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Under the chart metric */}
        <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Workforce Turnout</span>
          <span className="font-semibold text-slate-500">
            {hasData && turnoutRate !== null ? `Present: ${turnoutRate}%` : 'No attendance data available'}
          </span>
        </div>
      </div>

      {/* RIGHT: Attendance Summary (5 cols) */}
      <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Attendance Summary</h3>
            <span className="text-xs text-slate-500">Today</span>
          </div>

          {/* 4 Compact Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-700">Present</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 font-mono">
                {hasData ? presentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/[0.04] border border-rose-200">
              <div className="flex items-center gap-2.5">
                <UserX className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-medium text-slate-700">Absent</span>
              </div>
              <span className="text-sm font-bold text-rose-600 font-mono">
                {hasData ? absentCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/[0.04] border border-blue-200">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-700">On Leave</span>
              </div>
              <span className="text-sm font-bold text-blue-600 font-mono">
                {hasData ? leaveCount : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/[0.04] border border-sky-200">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-medium text-slate-700">WFH</span>
              </div>
              <span className="text-sm font-bold text-sky-600 font-mono">
                {hasData ? wfhCount : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* View Attendance Button */}
        <div className="pt-4 mt-4 border-t border-slate-200/70">
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

