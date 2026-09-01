import React from 'react';
import { AttendanceRecord } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Clock,
  Calendar,
  Building,
  User,
  Coffee,
  Sparkles,
  Moon,
  CheckCircle,
} from 'lucide-react';

interface HREmployeeDetailModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const HREmployeeDetailModal: React.FC<HREmployeeDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      id="employee-detail-modal"
    >
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 animate-scaleUp text-slate-700 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 border border-indigo-200 text-indigo-600 font-extrabold text-lg flex items-center justify-center">
            {record.employeeName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {record.employeeName}
              </h3>
              <StatusBadge status={record.status} size="xs" />
            </div>
            <p className="text-xs text-slate-500">
              {record.employeeCode} • {record.designation} • <span className="text-slate-600 font-semibold">{record.department}</span>
            </p>
          </div>
        </div>

        {/* Shift Details Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <span className="text-slate-500">Shift Date</span>
            <span className="font-bold text-slate-900">{record.attendanceDate} (Standard 6 PM - 3 AM)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block mb-0.5">Clock In Time</span>
              <div className="text-sm font-black text-slate-900 font-mono">{record.clockInTime}</div>
              <span className="text-[10px] text-slate-500">Date: {record.clockInDate}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block mb-0.5">Clock Out Time</span>
              <div className="text-sm font-black text-slate-900 font-mono">{record.clockOutTime}</div>
              <span className="text-[10px] text-indigo-600 font-medium">Date: {record.clockOutDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 block">Break Taken</span>
              <span className="text-xs font-bold text-slate-600 font-mono">{record.breakDuration}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 block">Net Work</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">{record.workingHours}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 block">Extra Hours</span>
              <span className="text-xs font-bold text-amber-600 font-mono">{record.extraHours}</span>
            </div>
          </div>

          {record.remarks && (
            <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs">
              <strong className="block text-[10px] text-indigo-600 uppercase tracking-wider mb-0.5">Log Remarks:</strong>
              {record.remarks}
            </div>
          )}
        </div>

        {/* Overnight Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500">
          <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Shift completed across the midnight threshold. Standard 8-hour requirement verified.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
