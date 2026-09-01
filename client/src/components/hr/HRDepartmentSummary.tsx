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
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          bar: 'bg-purple-500',
        };
      case 'Sales':
        return {
          bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          bar: 'bg-emerald-500',
        };
      case 'Tech':
        return {
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          bar: 'bg-blue-500',
        };
    }
  };

  return (
    <div
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl space-y-5"
      aria-label="Department Overview"
      id="department-overview-container"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Department Overview
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Workforce distribution and today's attendance rate by operational wing
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
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
                  ? 'bg-slate-100/60 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-50 border-slate-200/70 hover:border-slate-300/70 hover:bg-slate-100/50'
              }`}
              id={`dept-card-${dept.department.toLowerCase()}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${styling.bg}`}>
                    {dept.department}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{dept.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-400 block">Attendance</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="text-xl font-extrabold text-slate-900">
                    {dept.totalEmployees} <span className="text-xs font-normal text-slate-500">Employees</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dept.attendanceRate}%` }}
                      className={`h-full rounded-full ${styling.bar}`}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance metrics pill */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Present</span>
                  <span className="font-bold text-emerald-600">{dept.present}</span>
                </div>
                <div className="text-center border-x border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block">Absent</span>
                  <span className="font-bold text-rose-600">{dept.absent}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">On Leave</span>
                  <span className="font-bold text-blue-600">{dept.onLeave}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
