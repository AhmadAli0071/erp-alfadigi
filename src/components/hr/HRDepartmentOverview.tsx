import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { DepartmentSummaryItem } from '../../types/hr';

interface HRDepartmentOverviewProps {
  departments?: DepartmentSummaryItem[];
  onNavigate: (route: string) => void;
}

export const HRDepartmentOverview: React.FC<HRDepartmentOverviewProps> = ({
  departments = [],
  onNavigate,
}) => {
  // 3 standard departments
  const defaultDepts = [
    {
      name: 'HR',
      tagBg: 'bg-purple-50 text-purple-600 border-purple-200',
      barColor: 'bg-purple-500',
    },
    {
      name: 'Sales',
      tagBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      barColor: 'bg-emerald-500',
    },
    {
      name: 'Tech',
      tagBg: 'bg-blue-50 text-blue-600 border-blue-200',
      barColor: 'bg-blue-500',
    },
  ];

  return (
    <section
      className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4"
      aria-label="Department Overview"
      id="department-overview-container"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Department Overview</h3>
            <p className="text-xs text-slate-500">Staff distribution by wing</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/hr/employees')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-600 flex items-center gap-1 focus:outline-none cursor-pointer"
          id="view-employees-btn"
        >
          <span>View Employees</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Compact Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {defaultDepts.map((d) => {
          const deptData = departments.find((dept) => dept.department === d.name);
          const hasData = deptData && deptData.totalEmployees > 0;

          return (
            <div
              key={d.name}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300/70 transition-all flex flex-col justify-between"
              id={`dept-card-${d.name.toLowerCase()}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${d.tagBg}`}>
                    {d.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {hasData ? `${Math.round((deptData.presentCount / deptData.totalEmployees) * 100)}%` : '—'}
                  </span>
                </div>

                <div className="text-lg font-extrabold text-slate-900 mb-1">
                  {hasData ? deptData.totalEmployees : '—'}{' '}
                  <span className="text-xs font-normal text-slate-500">Employees</span>
                </div>

                {/* Small Attendance Progress Bar */}
                <div className="w-full bg-slate-100/60 h-1.5 rounded-full overflow-hidden my-2.5">
                  <div
                    style={{
                      width: hasData ? `${Math.round((deptData.presentCount / deptData.totalEmployees) * 100)}%` : '0%',
                    }}
                    className={`h-full rounded-full ${d.barColor}`}
                  />
                </div>
              </div>

              {/* Attendance breakdown */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/70 text-slate-500">
                <span className="text-slate-600 font-semibold">
                  Present: {hasData ? deptData.presentCount : '—'}
                </span>
                <span className="text-slate-500">
                  On Leave: {hasData ? deptData.onLeaveCount : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

