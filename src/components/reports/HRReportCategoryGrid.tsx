import React from 'react';
import { ReportCategory } from '../../types/report';
import {
  Clock,
  CalendarDays,
  Flame,
  Users,
  Building2,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HRReportCategoryGridProps {
  selectedCategory: ReportCategory;
  onSelectCategory: (cat: ReportCategory) => void;
}

export const HRReportCategoryGrid: React.FC<HRReportCategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    {
      id: 'attendance' as ReportCategory,
      title: 'Attendance Report',
      description: 'View attendance records, punch timings, working & short hours.',
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      accentBorder: 'group-hover:border-indigo-300',
      activeBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    },
    {
      id: 'leave' as ReportCategory,
      title: 'Leave Report',
      description: 'View employee leave quotas, approved/pending requests and types.',
      icon: <CalendarDays className="w-5 h-5 text-emerald-600" />,
      accentBorder: 'group-hover:border-emerald-300',
      activeBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    },
    {
      id: 'overtime' as ReportCategory,
      title: 'Overtime Report',
      description: 'View approved, pending and verified extra working hours.',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      accentBorder: 'group-hover:border-amber-300',
      activeBg: 'bg-amber-50 border-amber-200 text-amber-600',
    },
    {
      id: 'employee' as ReportCategory,
      title: 'Employee Report',
      description: 'View employee roster, designations, joining dates and statuses.',
      icon: <Users className="w-5 h-5 text-sky-600" />,
      accentBorder: 'group-hover:border-sky-300',
      activeBg: 'bg-sky-50 border-sky-200 text-sky-600',
    },
    {
      id: 'department' as ReportCategory,
      title: 'Department Report',
      description: 'View department-level headcount, attendance summaries & hours.',
      icon: <Building2 className="w-5 h-5 text-purple-600" />,
      accentBorder: 'group-hover:border-purple-300',
      activeBg: 'bg-purple-50 border-purple-300 text-purple-600',
    },
    {
      id: 'activity' as ReportCategory,
      title: 'HR Activity Report',
      description: 'View audit logs of HR administrative actions and system events.',
      icon: <Activity className="w-5 h-5 text-rose-600" />,
      accentBorder: 'group-hover:border-rose-300',
      activeBg: 'bg-rose-50 border-rose-200 text-rose-600',
    },
  ];

  return (
    <div className="space-y-3" id="hr-report-category-section">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Select Report Type
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                isSelected
                  ? `${cat.activeBg} shadow-lg shadow-black/40`
                  : 'bg-white/70 backdrop-blur-xl border-slate-200/70 hover:bg-slate-50 text-slate-600'
              }`}
              id={`report-category-card-${cat.id}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-100/60 border border-slate-200/80 shrink-0">
                    {cat.icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-600 border border-indigo-200">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between">
                <button
                  type="button"
                  className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  <span>Generate Report</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
