import React, { useEffect, useState } from 'react';
import { AttendanceRecord, AttendanceStatus } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Pencil,
  Clock,
  Timer,
  FileText,
  AlertCircle,
  Home,
  Loader2,
} from 'lucide-react';

export interface HRAttendanceUpdatePayload {
  status?: AttendanceStatus;
  notes?: string;
  clockIn?: string | null;
  clockOut?: string | null;
  /** Direct working-hours override in minutes; null restores punch-based calc. */
  workingMinutes?: number | null;
}

interface HRAttendanceEditModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  /** Submit the update; return true on success so the modal closes. */
  onSubmit: (id: string, payload: HRAttendanceUpdatePayload) => Promise<boolean>;
}

const STATUS_OPTIONS: { value: AttendanceStatus; hint: string }[] = [
  { value: 'Present', hint: 'Worked full shift at office' },
  { value: 'Work From Home', hint: 'Worked remotely' },
  { value: 'On Duty', hint: 'Official duty outside office' },
  { value: 'Absent', hint: 'No show, no approved leave' },
  { value: 'Late', hint: 'Clocked in after grace period' },
  { value: 'Half Day', hint: 'Worked half the shift' },
  { value: 'Short Hours', hint: 'Worked fewer than required hours' },
  { value: 'Leave', hint: 'Approved leave day' },
  { value: 'Pending OT', hint: 'Overtime awaiting HR approval' },
];

/** "05:55 PM" → "17:55" for time inputs. */
const toTimeInput = (display: string): string => {
  if (!display || display === '-') return '';
  const m = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(display.trim());
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
};

/** "07:40" → 460 */
const timeToMinutes = (value: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

export const HRAttendanceEditModal: React.FC<HRAttendanceEditModalProps> = ({ record, onClose, onSubmit }) => {
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [statusTouched, setStatusTouched] = useState(false);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [hoursEdited, setHoursEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setStatusTouched(false);
      setClockIn(toTimeInput(record.clockInTime));
      setClockOut(toTimeInput(record.clockOutTime));
      setWorkingHours(record.workingHours && record.workingHours !== '-' ? record.workingHours : '00:00');
      setHoursEdited(false);
      setNotes(record.notes || '');
      setErrorMsg(null);
    }
  }, [record]);

  if (!record) return null;

  const hasPendingCorrection = record.correctionStatus === 'PENDING';
  const hasPendingOT = record.otStatus === 'PENDING';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const payload: HRAttendanceUpdatePayload = {
      status,
      notes: notes.trim(),
      clockIn: clockIn || null,
      clockOut: clockOut || null,
    };
    if (hoursEdited) {
      const mins = timeToMinutes(workingHours);
      if (mins === null) {
        setIsSubmitting(false);
        setErrorMsg('Working hours must be a valid time like 07:40.');
        return;
      }
      payload.workingMinutes = mins;
      // Hours edited but status untouched → let the server derive it from the new minutes.
      if (!statusTouched) delete payload.status;
    }
    const ok = await onSubmit(record.id, payload);
    setIsSubmitting(false);
    if (ok) onClose();
    else setErrorMsg('Server could not save this update. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" id="hr-attendance-edit-modal">
      <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />

        <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl p-5 z-10 animate-scaleUp text-slate-700 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Edit Attendance</h3>
            <p className="text-xs text-slate-500">
              {record.employeeName} ({record.employeeCode}), {record.attendanceDate}
            </p>
          </div>
        </div>

        {/* Pending request context */}
        {(hasPendingCorrection || hasPendingOT) && (
          <div className="space-y-2">
            {hasPendingCorrection && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Pending Correction Request</span>
                </div>
                <p className="leading-relaxed">"{record.correctionReason}"</p>
                <p className="text-[10px] text-amber-600">Saving this edit will auto-resolve the correction request.</p>
              </div>
            )}
            {hasPendingOT && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Overtime Request</span>
                </div>
                <p className="leading-relaxed">"{record.otReason}"</p>
                <p className="text-[10px] text-indigo-500">Use the dashboard Action Center or drawer to approve/reject this OT.</p>
              </div>
            )}
          </div>
        )}

        {/* Status picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Attendance Status</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.hint}
                  onClick={() => {
                    setStatus(opt.value);
                    setStatusTouched(true);
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100/50 text-slate-600 border-slate-200/80 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge status={status} size="xs" />
            <span className="text-[10px] text-slate-400 italic">
              {STATUS_OPTIONS.find((o) => o.value === status)?.hint}
            </span>
          </div>
        </div>

        {/* Time editors */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Clock In
            </span>
            <input
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Clock Out
            </span>
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </label>
        </div>
        <p className="text-[10px] text-slate-400 -mt-2">
          Editing both times recalculates working hours automatically. Clear a time to remove the punch.
        </p>

        {/* Direct working-hours override */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3 h-3" /> Working Hours
            </span>
            <input
              type="time"
              value={workingHours}
              onChange={(e) => {
                setWorkingHours(e.target.value);
                setHoursEdited(true);
              }}
              className="w-full mt-1 px-2.5 py-2 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </label>
          <div className="pb-1">
            <button
              type="button"
              onClick={() => {
                setHoursEdited(false);
                setWorkingHours(record.workingHours && record.workingHours !== '-' ? record.workingHours : '00:00');
              }}
              disabled={!hoursEdited}
              className="px-3 py-2 rounded-xl border border-slate-200/80 text-[10px] font-bold text-slate-500 hover:bg-slate-100/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset to punches
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 -mt-2">
          {hoursEdited
            ? 'Saved as a manual override — this value will be used for salary instead of clock in/out.'
            : record.hoursManuallySet
              ? 'Working hours are currently set manually by HR. Editing keeps the manual value unless you reset.'
              : 'Leave untouched to keep hours derived from clock in/out.'}
        </p>

        {/* Notes */}
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notes / Remarks
          </span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Worked from home per team lead's approval"
            className="w-full mt-1 text-xs p-3 rounded-xl bg-slate-100/50 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </label>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-100/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            id="save-attendance-edit-btn"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Home className="w-3.5 h-3.5" />}
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
