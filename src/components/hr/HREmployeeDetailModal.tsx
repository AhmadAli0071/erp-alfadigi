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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[#121318] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 animate-scaleUp text-slate-200 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-extrabold text-lg flex items-center justify-center">
            {record.employeeName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {record.employeeName}
              </h3>
              <StatusBadge status={record.status} size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              {record.employeeCode} • {record.designation} • <span className="text-slate-300 font-semibold">{record.department}</span>
            </p>
          </div>
        </div>

        {/* Shift Details Breakdown */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-slate-400">Shift Date</span>
            <span className="font-bold text-white">{record.attendanceDate} (Standard 6 PM - 3 AM)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 block mb-0.5">Clock In Time</span>
              <div className="text-sm font-black text-white font-mono">{record.clockInTime}</div>
              <span className="text-[10px] text-slate-400">Date: {record.clockInDate}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-500 block mb-0.5">Clock Out Time</span>
              <div className="text-sm font-black text-white font-mono">{record.clockOutTime}</div>
              <span className="text-[10px] text-indigo-400 font-medium">Date: {record.clockOutDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-[10px] text-slate-500 block">Break Taken</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{record.breakDuration}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-[10px] text-slate-500 block">Net Work</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{record.workingHours}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-[10px] text-slate-500 block">Extra Hours</span>
              <span className="text-xs font-bold text-amber-400 font-mono">{record.extraHours}</span>
            </div>
          </div>

          {record.remarks && (
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              <strong className="block text-[10px] text-indigo-400 uppercase tracking-wider mb-0.5">Log Remarks:</strong>
              {record.remarks}
            </div>
          )}
        </div>

        {/* Overnight Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
          <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
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
