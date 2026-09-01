import React, { useState } from 'react';
import { LeaveRequest } from '../../types/leave';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  User,
} from 'lucide-react';

interface HRLeaveCalendarViewProps {
  requests: LeaveRequest[];
  onViewRequest: (request: LeaveRequest) => void;
  year?: number;
}

export const HRLeaveCalendarView: React.FC<HRLeaveCalendarViewProps> = ({
  requests,
  onViewRequest,
  year = 2026,
}) => {
  // Calendar month state (0-indexed: 7 is August 2026, 8 is September 2026)
  const [currentMonth, setCurrentMonth] = useState<number>(7); // Default August 2026
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'list'>('month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Helper to format date numbers with leading zero
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Build days for month view
  const firstDayOfMonth = new Date(year, currentMonth, 1).getDay();
  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, currentMonth, 0).getDate();

  const calendarDays = [];

  // Trailing days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${pad(prevMonthIdx + 1)}-${pad(dayNum)}`;
    calendarDays.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: dateStr === '2026-08-31',
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(currentMonth + 1)}-${pad(d)}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === '2026-08-31',
    });
  }

  // Next month leading days to complete 35 or 42 grid slots
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${pad(nextMonthIdx + 1)}-${pad(d)}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === '2026-08-31',
    });
  }

  // Get leave events for a given date
  const getLeavesForDate = (dateStr: string) => {
    return requests.filter((req) => req.startDate <= dateStr && req.endDate >= dateStr);
  };

  const getLeaveChipColor = (req: LeaveRequest) => {
    if (req.status === 'Pending') {
      return 'bg-amber-100/70 text-amber-600 border-amber-200 hover:bg-amber-100';
    }
    if (req.status === 'Rejected') {
      return 'bg-rose-100/70 text-rose-600 border-rose-200 hover:bg-rose-100';
    }
    switch (req.leaveType) {
      case 'Casual Leave':
        return 'bg-indigo-100/70 text-indigo-600 border-indigo-200 hover:bg-indigo-100';
      case 'Annual Leave':
        return 'bg-emerald-100/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'Sick Leave':
        return 'bg-amber-100/70 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'Unpaid Leave':
        return 'bg-rose-100/70 text-rose-700 border-rose-200 hover:bg-rose-100';
      default:
        return 'bg-sky-100/70 text-sky-700 border-sky-200 hover:bg-sky-100';
    }
  };

  // Month-filtered requests for list/agenda mode
  const currentMonthPrefix = `${year}-${pad(currentMonth + 1)}`;
  const monthRequests = requests.filter(
    (r) => r.startDate.startsWith(currentMonthPrefix) || r.endDate.startsWith(currentMonthPrefix)
  );

  return (
    <div className="space-y-4" id="leave-calendar-container">
      {/* Calendar Controls Top Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{monthNames[currentMonth]}</span>
              <span className="text-indigo-600 font-mono">{year}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {monthRequests.length} leave {monthRequests.length === 1 ? 'event' : 'events'} recorded in this month
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(7)} // August 2026
              className="px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle: Month / Week / List */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCalendarMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calendarMode === 'month'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setCalendarMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calendarMode === 'week'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setCalendarMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calendarMode === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            List / Agenda
          </button>
        </div>
      </div>

      {/* Mode 1: Month Grid View */}
      {calendarMode === 'month' && (
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200/70 bg-slate-50 text-center text-xs font-bold text-slate-500 py-2.5">
            {daysOfWeek.map((d) => (
              <div key={d} className="uppercase tracking-wider text-[11px]">
                {d}
              </div>
            ))}
          </div>

          {/* Days Slots */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/70 bg-[#F7F9FC]">
            {calendarDays.map((slot) => {
              const dayLeaves = getLeavesForDate(slot.dateStr);

              return (
                <div
                  key={slot.dateStr}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between ${
                    slot.isCurrentMonth ? 'bg-white/75 backdrop-blur-xl' : 'bg-[#F7F9FC]/60 opacity-40'
                  } ${slot.isToday ? 'ring-1 ring-indigo-500 bg-indigo-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        slot.isToday
                          ? 'bg-indigo-600 text-white font-black'
                          : slot.isCurrentMonth
                          ? 'text-slate-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {slot.dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {dayLeaves.length} on leave
                      </span>
                    )}
                  </div>

                  {/* Leave Chips in Slot */}
                  <div className="space-y-1 overflow-y-auto max-h-[65px] custom-scrollbar">
                    {dayLeaves.map((leave) => (
                      <button
                        key={`${leave.id}-${slot.dateStr}`}
                        type="button"
                        onClick={() => onViewRequest(leave)}
                        className={`w-full text-left p-1 rounded-md text-[10px] font-semibold border truncate transition-colors block cursor-pointer ${getLeaveChipColor(
                          leave
                        )}`}
                        title={`${leave.employeeName} — ${leave.leaveType} (${leave.status})`}
                      >
                        <div className="truncate flex items-center gap-1">
                          {leave.status === 'Pending' && (
                            <Clock className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                          )}
                          <span className="truncate">{leave.employeeName.split(' ')[0]}</span>
                          <span className="text-slate-500 hidden sm:inline">• {leave.leaveType.split(' ')[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Week View */}
      {calendarMode === 'week' && (
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-bold text-slate-900">Current Week Schedule (31 Aug – 06 Sep 2026)</span>
            <span className="text-slate-500">7 Days View</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70">
            {['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'].map(
              (dateStr, idx) => {
                const dayLeaves = getLeavesForDate(dateStr);
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const dayNum = dateStr.split('-')[2];
                const isToday = dateStr === '2026-08-31';

                return (
                  <div
                    key={dateStr}
                    className={`p-3 min-h-[160px] flex flex-col justify-start space-y-2 ${
                      isToday ? 'bg-indigo-50/50 ring-1 ring-indigo-500/40' : 'bg-white/75 backdrop-blur-xl'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {dayNames[idx]}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          isToday ? 'bg-indigo-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        {dayNum} Aug
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                      {dayLeaves.length === 0 ? (
                        <span className="text-[11px] text-slate-700 italic block pt-2">No leaves</span>
                      ) : (
                        dayLeaves.map((leave) => (
                          <div
                            key={`${leave.id}-${dateStr}`}
                            onClick={() => onViewRequest(leave)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer ${getLeaveChipColor(
                              leave
                            )}`}
                          >
                            <div className="font-bold text-slate-900 truncate">{leave.employeeName}</div>
                            <div className="text-[10px] text-slate-600 flex items-center justify-between mt-1">
                              <span>{leave.leaveType}</span>
                              <span className="font-mono">{leave.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Mode 3: List / Agenda View */}
      {calendarMode === 'list' && (
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-slate-200/70 shadow-md divide-y divide-slate-200/70">
          <div className="p-4 bg-slate-50 text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>Agenda for {monthNames[currentMonth]} {year}</span>
            <span className="font-mono text-indigo-600">{monthRequests.length} Events</span>
          </div>

          {monthRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No leave requests scheduled for this month.
            </div>
          ) : (
            monthRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onViewRequest(req)}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                    {req.employeeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{req.employeeName}</span>
                      <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {req.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {req.department} • {req.designation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right text-xs">
                    <div className="font-semibold text-slate-700">{req.leaveType}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {req.startDateDisplay} — {req.endDateDisplay} ({req.totalDays}d)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewRequest(req);
                    }}
                    className="p-2 rounded-xl bg-slate-100/60 hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 border border-slate-200/80 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
