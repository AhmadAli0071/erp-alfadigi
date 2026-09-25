import React, { useState } from 'react';
import { AttendanceRecord } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Clock,
  Calendar,
  Coffee,
  Play,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sparkles,
  ShieldCheck,
  Pencil,
  Loader2,
  Check,
  XCircle,
} from 'lucide-react';

interface HRAttendanceDetailDrawerProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionAction?: (
    id: string,
    kind: 'correction' | 'ot',
    decision: 'APPROVED' | 'REJECTED',
    note?: string,
  ) => Promise<boolean>;
  onOvertimeAction?: (
    id: string,
    kind: 'correction' | 'ot',
    decision: 'APPROVED' | 'REJECTED',
    note?: string,
  ) => Promise<boolean>;
  onEdit?: (record: AttendanceRecord) => void;
  /** Called after a successful action so the parent can sync the fresh record. */
  onRecordSync?: (id: string) => void;
}

export const HRAttendanceDetailDrawer: React.FC<HRAttendanceDetailDrawerProps> = ({
  record,
  isOpen,
  onClose,
  onCorrectionAction,
  onOvertimeAction,
  onEdit,
  onRecordSync,
}) => {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const decide = async (kind: 'correction' | 'ot', decision: 'APPROVED' | 'REJECTED') => {
    if (!record.id) return;
    setBusyKey(`${kind}-${decision}`);
    const handler = kind === 'correction' ? onCorrectionAction : onOvertimeAction;
    const ok = handler ? await handler(record.id, kind, decision) : false;
    setBusyKey(null);
    if (ok) onRecordSync?.(record.id);
  };

  const correctionPending = record.correctionStatus === 'PENDING';
  const otPending = record.otStatus === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      id="attendance-detail-drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel (Desktop: right side drawer, Mobile: full screen / max-w-full) */}
      <div className="relative w-full sm:max-w-md md:max-w-lg bg-white/85 backdrop-blur-2xl border-l border-slate-200/80 sm:rounded-l-3xl shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-slideInRight text-slate-700">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/70 flex items-start justify-between shrink-0 bg-white/75 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 border border-indigo-200 text-indigo-600 font-extrabold text-base flex items-center justify-center shadow-inner shrink-0">
              {record.employeeName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {record.employeeName}
                </h3>
                <StatusBadge status={record.status} size="xs" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-mono text-slate-600">{record.employeeCode}</span> •{' '}
                <span className="text-indigo-600 font-medium">{record.department}</span>
                {record.designation && <span> • {record.designation}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
            aria-label="Close drawer"
            id="close-detail-drawer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Pending Correction Request */}
          {correctionPending && onCorrectionAction && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span>Pending Correction Request</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-amber-100">
                "{record.correctionReason || 'No reason provided.'}"
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide('correction', 'APPROVED')}
                  disabled={busyKey !== null}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {busyKey === 'correction-APPROVED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Approve & Resolve</span>
                </button>
                <button
                  type="button"
                  onClick={() => decide('correction', 'REJECTED')}
                  disabled={busyKey !== null}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {busyKey === 'correction-REJECTED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Reject Request</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-600">
                Tip: use "Edit Status" to fix the record. The correction auto-resolves on save.
              </p>
            </div>
          )}
          {record.correctionStatus === 'APPROVED' && record.correctionNote && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Correction resolved: {record.correctionNote}</span>
            </div>
          )}
          {record.correctionStatus === 'REJECTED' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Correction request rejected{record.correctionNote ? `: ${record.correctionNote}` : ''}.
              </span>
            </div>
          )}

          {/* Pending Overtime Request */}
          {otPending && onOvertimeAction && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Pending Overtime Request</span>
                </div>
                <span className="font-mono bg-white/70 px-2 py-0.5 rounded-lg border border-indigo-200">
                  +{record.extraHours}
                </span>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-indigo-100">
                "{record.otReason || 'No reason provided.'}"
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide('ot', 'APPROVED')}
                  disabled={busyKey !== null}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {busyKey === 'ot-APPROVED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Approve OT</span>
                </button>
                <button
                  type="button"
                  onClick={() => decide('ot', 'REJECTED')}
                  disabled={busyKey !== null}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {busyKey === 'ot-REJECTED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Reject OT</span>
                </button>
              </div>
            </div>
          )}
          {record.otStatus === 'APPROVED' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Overtime approved: {Math.floor((record.otApprovedMinutes || 0) / 60)}h
                {' '}{(record.otApprovedMinutes || 0) % 60}m
                {record.otNote ? ` (${record.otNote})` : ''}
              </span>
            </div>
          )}
          {record.otStatus === 'REJECTED' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Overtime request rejected{record.otNote ? `: ${record.otNote}` : ''}.
              </span>
            </div>
          )}

          {/* Shift & Date Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Shift Date</span>
              </div>
              <span className="font-bold text-slate-900">{record.attendanceDate}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Assigned Shift</span>
              </div>
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Standard (6:00 PM – 3:00 AM)
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 font-medium block">Clock In</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {record.clockInTime}
              </div>
              <span className="text-[10px] text-slate-500">
                {record.clockInDate !== '-' ? `Date: ${record.clockInDate}` : 'No punch'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] text-slate-400 font-medium block">Clock Out</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {record.clockOutTime}
              </div>
              <span className="text-[10px] text-indigo-600 font-medium">
                {record.clockOutDate !== '-' ? `Date: ${record.clockOutDate}` : 'No punch'}
              </span>
            </div>
          </div>

          {/* Time Breakdown (3-column) */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-medium">Break Time</span>
              <span className="text-xs font-bold text-slate-600 font-mono mt-0.5 block">
                {record.breakDuration}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-medium">Net Working</span>
              <span
                className={`text-xs font-black font-mono mt-0.5 block ${
                  record.workingHours >= '08:00' ? 'text-emerald-600' : 'text-slate-700'
                }`}
              >
                {record.workingHours}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-medium">Extra Hours</span>
              <span
                className={`text-xs font-bold font-mono mt-0.5 block ${
                  record.extraHours !== '00:00' ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                {record.extraHours !== '00:00' ? `+${record.extraHours}` : '00:00'}
              </span>
            </div>
          </div>

          {/* Overnight Notice */}
          {record.isOvernight && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-600">
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Overnight Shift Crossover:</strong> Punches after midnight carry over into the next day while remaining attached to this shift date.
              </span>
            </div>
          )}

          {/* Notes / Remarks */}
          {record.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Log Notes & Remarks
              </span>
              <p className="text-slate-600 leading-relaxed">{record.notes}</p>
            </div>
          )}

          {/* Visual Attendance Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shift Punch Timeline
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                {record.timeline ? `${record.timeline.length} events` : 'Biometric Log'}
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/50">
              {record.timeline && record.timeline.length > 0 ? (
                record.timeline.map((event, idx) => {
                  const getIcon = () => {
                    if (event.type === 'CLOCK_IN')
                      return <Clock className="w-3 h-3 text-emerald-600" />;
                    if (event.type === 'CLOCK_OUT')
                      return <CheckCircle2 className="w-3 h-3 text-indigo-600" />;
                    if (event.type === 'PAUSE')
                      return <Coffee className="w-3 h-3 text-amber-600" />;
                    if (event.type === 'RESUME')
                      return <Play className="w-3 h-3 text-sky-600" />;
                    return <AlertCircle className="w-3 h-3 text-slate-500" />;
                  };

                  const getBg = () => {
                    if (event.type === 'CLOCK_IN') return 'bg-emerald-100/70 border-emerald-200';
                    if (event.type === 'CLOCK_OUT') return 'bg-indigo-100/70 border-indigo-200';
                    if (event.type === 'PAUSE') return 'bg-amber-100/70 border-amber-200';
                    if (event.type === 'RESUME') return 'bg-sky-100/70 border-sky-200';
                    return 'bg-slate-200/50 border-slate-300/80';
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
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{event.label}</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-600">
                            {event.time} <span className="text-[9px] text-slate-400">({event.date})</span>
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 italic py-2">
                  No timestamped events recorded for this shift.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/70 bg-white/75 backdrop-blur-xl shrink-0 flex items-center justify-end gap-2.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              id="edit-attendance-from-drawer-btn"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Status</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-100/60 hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
