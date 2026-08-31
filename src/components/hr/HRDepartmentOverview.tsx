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
      tagBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      barColor: 'bg-purple-500',
    },
    {
      name: 'Sales',
      tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      barColor: 'bg-emerald-500',
    },
    {
      name: 'Tech',
      tagBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      barColor: 'bg-blue-500',
    },
  ];

  return (
    <section
      className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-sm space-y-4"
      aria-label="Department Overview"
      id="department-overview-container"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Department Overview</h3>
            <p className="text-xs text-slate-400">Staff distribution by wing</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/hr/employees')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 focus:outline-none cursor-pointer"
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
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
              id={`dept-card-${d.name.toLowerCase()}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${d.tagBg}`}>
                    {d.name}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {hasData ? `${Math.round((deptData.presentCount / deptData.totalEmployees) * 100)}%` : '—'}
                  </span>
                </div>

                <div className="text-lg font-extrabold text-white mb-1">
                  {hasData ? deptData.totalEmployees : '—'}{' '}
                  <span className="text-xs font-normal text-slate-400">Employees</span>
                </div>

                {/* Small Attendance Progress Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden my-2.5">
                  <div
                    style={{
                      width: hasData ? `${Math.round((deptData.presentCount / deptData.totalEmployees) * 100)}%` : '0%',
                    }}
                    className={`h-full rounded-full ${d.barColor}`}
                  />
                </div>
              </div>

              {/* Attendance breakdown */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-400">
                <span className="text-slate-300 font-semibold">
                  Present: {hasData ? deptData.presentCount : '—'}
                </span>
                <span className="text-slate-400">
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

