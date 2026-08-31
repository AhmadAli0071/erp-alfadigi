import React from 'react';
import { AttendanceRecord } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Clock,
  Calendar,
  Building,
  Coffee,
  Play,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';

interface HRAttendanceDetailDrawerProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HRAttendanceDetailDrawer: React.FC<HRAttendanceDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      id="attendance-detail-drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel (Desktop: right side drawer, Mobile: full screen / max-w-full) */}
      <div className="relative w-full sm:max-w-md md:max-w-lg bg-[#121318] border-l border-white/10 shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-slideInRight text-slate-200">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-white/5 flex items-start justify-between shrink-0 bg-[#0d0e12]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-base flex items-center justify-center shadow-inner shrink-0">
              {record.employeeName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {record.employeeName}
                </h3>
                <StatusBadge status={record.status} size="xs" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-slate-300">{record.employeeCode}</span> •{' '}
                <span className="text-indigo-300 font-medium">{record.department}</span>
                {record.designation && <span> • {record.designation}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
            aria-label="Close drawer"
            id="close-detail-drawer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Shift & Date Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Shift Date</span>
              </div>
              <span className="font-bold text-white">{record.attendanceDate}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Assigned Shift</span>
              </div>
              <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                Standard (6:00 PM – 3:00 AM)
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-slate-500 font-medium block">Clock In</span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {record.clockInTime}
              </div>
              <span className="text-[10px] text-slate-400">
                {record.clockInDate !== '—' ? `Date: ${record.clockInDate}` : 'No punch'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-slate-500 font-medium block">Clock Out</span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {record.clockOutTime}
              </div>
              <span className="text-[10px] text-indigo-400 font-medium">
                {record.clockOutDate !== '—' ? `Date: ${record.clockOutDate}` : 'No punch'}
              </span>
            </div>
          </div>

          {/* Time Breakdown (3-column) */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 block font-medium">Break Time</span>
              <span className="text-xs font-bold text-slate-300 font-mono mt-0.5 block">
                {record.breakDuration}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 block font-medium">Net Working</span>
              <span
                className={`text-xs font-black font-mono mt-0.5 block ${
                  record.workingHours >= '08:00' ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                {record.workingHours}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 block font-medium">Extra Hours</span>
              <span
                className={`text-xs font-bold font-mono mt-0.5 block ${
                  record.extraHours !== '00:00' ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {record.extraHours !== '00:00' ? `+${record.extraHours}` : '00:00'}
              </span>
            </div>
          </div>

          {/* Overnight Notice */}
          {record.isOvernight && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Overnight Shift Crossover:</strong> Punches after midnight carry over into the next day while remaining attached to this shift date.
              </span>
            </div>
          )}

          {/* Notes / Remarks */}
          {record.notes && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Log Notes & Remarks
              </span>
              <p className="text-slate-300 leading-relaxed">{record.notes}</p>
            </div>
          )}

          {/* Visual Attendance Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Shift Punch Timeline
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                {record.timeline ? `${record.timeline.length} events` : 'Biometric Log'}
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {record.timeline && record.timeline.length > 0 ? (
                record.timeline.map((event, idx) => {
                  const getIcon = () => {
                    if (event.type === 'CLOCK_IN')
                      return <Clock className="w-3 h-3 text-emerald-400" />;
                    if (event.type === 'CLOCK_OUT')
                      return <CheckCircle2 className="w-3 h-3 text-indigo-400" />;
                    if (event.type === 'PAUSE')
                      return <Coffee className="w-3 h-3 text-amber-400" />;
                    if (event.type === 'RESUME')
                      return <Play className="w-3 h-3 text-sky-400" />;
                    return <AlertCircle className="w-3 h-3 text-slate-400" />;
                  };

                  const getBg = () => {
                    if (event.type === 'CLOCK_IN') return 'bg-emerald-500/20 border-emerald-500/40';
                    if (event.type === 'CLOCK_OUT') return 'bg-indigo-500/20 border-indigo-500/40';
                    if (event.type === 'PAUSE') return 'bg-amber-500/20 border-amber-500/40';
                    if (event.type === 'RESUME') return 'bg-sky-500/20 border-sky-500/40';
                    return 'bg-white/10 border-white/20';
                  };

                  return (
                    <div key={event.id || idx} className="relative group">
                      {/* Node Dot */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${getBg()}`}
                      >
                        {getIcon()}
                      </div>

                      {/* Event details */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{event.label}</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-300">
                            {event.time} <span className="text-[9px] text-slate-500">({event.date})</span>
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No timestamped events recorded for this shift.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0d0e12] shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
