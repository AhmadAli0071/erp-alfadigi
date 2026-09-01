import React, { useState } from 'react';
import { User } from '../../types/auth';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Square,
  Timer,
  Coffee,
  CalendarDays,
  Ticket,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface EmployeeDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

type ClockState = 'not_clocked_in' | 'working' | 'on_break' | 'clocked_out';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ user, onNavigate }) => {
  const [clockState, setClockState] = useState<ClockState>('not_clocked_in');
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<string | null>(null);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);

  const formatCurrentTime = (): string => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleClockIn = () => {
    setClockState('working');
    setClockInTime(formatCurrentTime());
  };

  const handlePauseBreak = () => {
    setClockState('on_break');
    setBreakStartTime(formatCurrentTime());
  };

  const handleResumeWork = () => {
    setClockState('working');
    setBreakStartTime(null);
    setTotalBreakMinutes((prev) => prev + 18);
  };

  const handleClockOut = () => {
    setClockState('clocked_out');
    setClockOutTime(formatCurrentTime());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="employee-dashboard-main-view">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user.name?.split(' ')[0] || 'Employee'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Here's your work overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-900">{getFormattedDate()}</span>
        </div>
      </div>

      {/* Clock In/Out Card - Primary Action */}
      <section aria-label="Today's Attendance" id="employee-clock-card">
        <div className={`rounded-2xl p-6 sm:p-8 shadow-sm border transition-all ${
          clockState === 'working' ? 'bg-emerald-50/50 border-emerald-200' :
          clockState === 'on_break' ? 'bg-amber-50/50 border-amber-200' :
          clockState === 'clocked_out' ? 'bg-slate-50/50 border-slate-200' :
          'bg-white/80 backdrop-blur-xl border-slate-200/80'
        }`}>
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* Left: Status Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  clockState === 'working' ? 'bg-emerald-500 animate-pulse' :
                  clockState === 'on_break' ? 'bg-amber-500 animate-pulse' :
                  clockState === 'clocked_out' ? 'bg-slate-400' :
                  'bg-slate-300'
                }`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  clockState === 'working' ? 'text-emerald-700' :
                  clockState === 'on_break' ? 'text-amber-700' :
                  clockState === 'clocked_out' ? 'text-slate-600' :
                  'text-slate-500'
                }`}>
                  {clockState === 'not_clocked_in' ? 'Not Clocked In' :
                   clockState === 'working' ? 'Working' :
                   clockState === 'on_break' ? 'On Break' :
                   'Workday Complete'}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                {clockState === 'not_clocked_in' && "You haven't clocked in yet"}
                {clockState === 'working' && `Clocked in at ${clockInTime}`}
                {clockState === 'on_break' && `On break since ${breakStartTime}`}
                {clockState === 'clocked_out' && 'Workday Complete'}
              </h3>

              <p className="text-sm text-slate-500 font-medium">
                {clockState === 'not_clocked_in' && 'Tap the button to start your workday'}
                {clockState === 'working' && 'Keep up the great work!'}
                {clockState === 'on_break' && 'Break time is deducted from working hours'}
                {clockState === 'clocked_out' && `Clock in: ${clockInTime} • Clock out: ${clockOutTime}`}
              </p>

              {/* Working Time Display */}
              {clockState !== 'not_clocked_in' && (
                <div className="flex items-center justify-center lg:justify-start gap-4 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200/70">
                    <Timer className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {clockState === 'clocked_out' ? '7h 32m' : 'Working'}
                    </span>
                  </div>
                  {totalBreakMinutes > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200/70">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">{totalBreakMinutes}m break</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              {clockState === 'not_clocked_in' && (
                <button
                  type="button"
                  onClick={handleClockIn}
                  className="w-40 h-40 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  id="btn-clock-in"
                >
                  <Play className="w-8 h-8" />
                  <span className="text-sm font-bold">Clock In</span>
                </button>
              )}

              {clockState === 'working' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePauseBreak}
                    className="w-32 h-32 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    id="btn-pause-break"
                  >
                    <Pause className="w-6 h-6" />
                    <span className="text-xs font-bold">Pause Break</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-32 h-32 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    id="btn-clock-out"
                  >
                    <Square className="w-6 h-6" />
                    <span className="text-xs font-bold">Clock Out</span>
                  </button>
                </div>
              )}

              {clockState === 'on_break' && (
                <button
                  type="button"
                  onClick={handleResumeWork}
                  className="w-40 h-40 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  id="btn-resume-work"
                >
                  <Play className="w-8 h-8" />
                  <span className="text-sm font-bold">Resume Work</span>
                </button>
              )}

              {clockState === 'clocked_out' && (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Day complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Summary Cards */}
      <section aria-label="Today's Summary" id="employee-today-summary">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Clock In', value: clockInTime || '—', icon: <Play className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
            { label: 'Clock Out', value: clockOutTime || '—', icon: <Square className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
            { label: 'Working Hours', value: clockState === 'clocked_out' ? '7h 32m' : '—', icon: <Timer className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-500/[0.04] border-indigo-200' },
            { label: 'Break Time', value: totalBreakMinutes > 0 ? `${totalBreakMinutes}m` : '—', icon: <Coffee className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
            { label: 'Status', value: clockState === 'not_clocked_in' ? '—' : clockState === 'working' ? 'Working' : clockState === 'on_break' ? 'On Break' : 'Complete', icon: <Clock className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-500/[0.04] border-violet-200' },
            { label: 'Shift', value: '6PM–3AM', icon: <CalendarDays className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-500/[0.04] border-sky-200' },
          ].map((card, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${card.bg} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                {card.icon}
                <span className="text-xs font-medium text-slate-700">{card.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono">{card.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Grid: Leave Summary + Pending Tickets + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Leave Summary */}
        <div className="lg:col-span-4">
          <section aria-label="Leave Summary" id="employee-leave-summary" className="h-full">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Leave Balance</h3>
                    <p className="text-xs text-slate-500">This year</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                    <CalendarDays className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No leave data available</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Leave balance will appear here.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/employee/leaves')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request Leave</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </div>

        {/* Pending Tickets */}
        <div className="lg:col-span-4">
          <section aria-label="Pending Tickets" id="employee-pending-tickets" className="h-full">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">My Tickets</h3>
                    <p className="text-xs text-slate-500">Support requests</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                    <Ticket className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No tickets</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your support tickets will appear here.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/employee/tickets')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4">
          <section aria-label="Quick Actions" id="employee-quick-actions" className="h-full">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Frequent actions</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 py-4">
                {[
                  { label: 'View Attendance', icon: <Clock className="w-4 h-4 text-emerald-600" />, route: '/employee/attendance', hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-500/[0.04]' },
                  { label: 'Request Leave', icon: <CalendarDays className="w-4 h-4 text-blue-600" />, route: '/employee/leaves', hoverBorder: 'hover:border-blue-200 hover:bg-blue-500/[0.04]' },
                  { label: 'Create Ticket', icon: <Ticket className="w-4 h-4 text-purple-600" />, route: '/employee/tickets', hoverBorder: 'hover:border-purple-200 hover:bg-purple-500/[0.04]' },
                  { label: 'View Profile', icon: <AlertCircle className="w-4 h-4 text-slate-600" />, route: '/employee/profile', hoverBorder: 'hover:border-slate-200 hover:bg-slate-500/[0.04]' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    className={`w-full p-3 rounded-xl bg-white/80 border border-slate-200/80 text-left transition-all flex items-center gap-3 group cursor-pointer ${item.hoverBorder}`}
                  >
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};
