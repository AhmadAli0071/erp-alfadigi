import React from 'react';
import { DepartmentSummaryItem, DepartmentName } from '../../types/hr';
import { Building2, Users, ArrowRight, UserCheck, UserX, Calendar } from 'lucide-react';

interface HRDepartmentSummaryProps {
  departments: DepartmentSummaryItem[];
  onSelectDepartment: (dept: DepartmentName) => void;
  selectedDepartment?: string;
}

export const HRDepartmentSummary: React.FC<HRDepartmentSummaryProps> = ({
  departments,
  onSelectDepartment,
  selectedDepartment,
}) => {
  const getDeptColor = (dept: DepartmentName) => {
    switch (dept) {
      case 'HR':
        return {
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          bar: 'bg-purple-500',
        };
      case 'Sales':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          bar: 'bg-emerald-500',
        };
      case 'Tech':
        return {
          bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          bar: 'bg-blue-500',
        };
    }
  };

  return (
    <div
      className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5"
      aria-label="Department Overview"
      id="department-overview-container"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Department Overview
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Workforce distribution and today's attendance rate by operational wing
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Click a department to filter attendance table
        </span>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const styling = getDeptColor(dept.department);
          const isSelected = selectedDepartment === dept.department;

          return (
            <div
              key={dept.department}
              onClick={() => onSelectDepartment(dept.department)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                isSelected
                  ? 'bg-white/[0.06] border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
              }`}
              id={`dept-card-${dept.department.toLowerCase()}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${styling.bg}`}>
                    {dept.department}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{dept.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="text-xl font-extrabold text-white">
                    {dept.totalEmployees} <span className="text-xs font-normal text-slate-400">Employees</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dept.attendanceRate}%` }}
                      className={`h-full rounded-full ${styling.bar}`}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance metrics pill */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Present</span>
                  <span className="font-bold text-emerald-400">{dept.present}</span>
                </div>
                <div className="text-center border-x border-white/5">
                  <span className="text-[10px] text-slate-500 block">Absent</span>
                  <span className="font-bold text-rose-400">{dept.absent}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">On Leave</span>
                  <span className="font-bold text-blue-400">{dept.onLeave}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
