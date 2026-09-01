import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import {
  Calendar,
  Users,
  UserCheck,
  ListTodo,
  FolderKanban,
  Ticket,
  Clock,
  AlertCircle,
  ArrowRight,
  Activity,
  Zap,
  CheckCircle2,
  ChevronRight,
  GitBranch,
} from 'lucide-react';

interface TechDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const TechDashboardView: React.FC<TechDashboardViewProps> = ({ user, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/60 border border-slate-200/60 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasAttendance = false;
  const hasTasks = false;
  const hasProjects = false;
  const hasTickets = false;
  const hasActivities = false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="tech-dashboard-main-view">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user.name?.split(' ')[0] || 'Tech Lead'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Here's your technology team overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-900">{getFormattedDate()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <section aria-label="Tech KPI Metrics" id="tech-kpi-grid">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {[
            { title: 'Team Members', value: '—', context: 'Tech team', icon: <Users className="w-5 h-5 text-indigo-600" />, tagLabel: 'Active', tagColor: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
            { title: 'Present Today', value: '—', context: 'On duty', icon: <UserCheck className="w-5 h-5 text-emerald-600" />, tagLabel: 'On Duty', tagColor: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            { title: 'Active Tasks', value: '—', context: 'In progress', icon: <ListTodo className="w-5 h-5 text-blue-600" />, tagLabel: 'Active', tagColor: 'bg-blue-50 text-blue-600 border-blue-200' },
            { title: 'Pending Tasks', value: '—', context: 'Awaiting action', icon: <Clock className="w-5 h-5 text-amber-600" />, tagLabel: 'Pending', tagColor: 'bg-amber-50 text-amber-600 border-amber-200' },
            { title: 'Open Tickets', value: '—', context: 'Technical issues', icon: <Ticket className="w-5 h-5 text-purple-600" />, tagLabel: 'Open', tagColor: 'bg-purple-50 text-purple-600 border-purple-200' },
            { title: 'Projects', value: '—', context: 'Active projects', icon: <FolderKanban className="w-5 h-5 text-rose-600" />, tagLabel: 'Tracked', tagColor: 'bg-rose-50 text-rose-600 border-rose-200' },
          ].map((card, idx) => (
            <div key={idx} className="group p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl bg-slate-100/50 border border-slate-200/70 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                  {card.icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.tagColor}`}>
                  {card.tagLabel}
                </span>
              </div>
              <div className="my-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
              </div>
              <div className="mt-1 pt-1 border-t border-slate-200/70">
                <h3 className="text-xs font-bold text-slate-700 truncate">{card.title}</h3>
                <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{card.context}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Requires Your Attention */}
      <section aria-label="Requires Your Attention" id="tech-attention-section" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Requires Your Attention</h3>
              <p className="text-xs text-slate-500">Priority items needing your review</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Overdue Tasks', description: 'Tasks that have passed their deadline.', icon: <Clock className="w-5 h-5 text-rose-600" />, tagColor: 'bg-rose-50 text-rose-600 border-rose-200', btnColor: 'bg-rose-600 hover:bg-rose-500 text-white', route: '/lead/tasks' },
            { title: 'Open Technical Tickets', description: 'Tickets require your review.', icon: <Ticket className="w-5 h-5 text-purple-600" />, tagColor: 'bg-purple-50 text-purple-600 border-purple-200', btnColor: 'bg-purple-600 hover:bg-purple-500 text-white', route: '/lead/tickets' },
            { title: 'Leave Requests', description: 'Team leave requests pending your approval.', icon: <Calendar className="w-5 h-5 text-blue-600" />, tagColor: 'bg-blue-50 text-blue-600 border-blue-200', btnColor: 'bg-blue-600 hover:bg-blue-500 text-white', route: '/lead/leave' },
          ].map((card, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/80 transition-all flex flex-col justify-between shadow-sm group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.tagColor}`}>No pending data</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{card.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">{card.description}</p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <button type="button" onClick={() => onNavigate(card.route)} className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                  View all &rarr;
                </button>
                <button type="button" onClick={() => onNavigate(card.route)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${card.btnColor}`}>
                  <span>Review</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Attendance */}
      <section aria-label="Team Attendance" id="tech-attendance-section">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Tech Team Attendance</h3>
                <p className="text-xs text-slate-500">Today's attendance overview</p>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('/lead/attendance')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasAttendance ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Employee</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Clock In</th>
                    <th className="pb-3 pr-4">Working Hours</th>
                    <th className="pb-3">Current State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70" />
              </table>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                <Clock className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No attendance records available</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Team attendance will appear here once recorded.</p>
            </div>
          )}
        </div>
      </section>

      {/* Task Overview */}
      <section aria-label="Task Overview" id="tech-task-section">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Task Overview</h3>
                <p className="text-xs text-slate-500">Current task statuses</p>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('/lead/tasks')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasTasks ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {['To Do', 'In Progress', 'Review', 'Blocked'].map((status, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-lg font-bold text-slate-900">0</span>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{status}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                <ListTodo className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No tasks available</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tasks will appear here once assigned.</p>
            </div>
          )}
        </div>
      </section>

      {/* Project Overview */}
      <section aria-label="Project Overview" id="tech-project-section">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Project Overview</h3>
                <p className="text-xs text-slate-500">Active projects and progress</p>
              </div>
            </div>
          </div>

          {hasProjects ? (
            <div className="space-y-4 mt-4" />
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                <FolderKanban className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No active projects</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Projects will appear here once created.</p>
            </div>
          )}
        </div>
      </section>

      {/* Technical Tickets */}
      <section aria-label="Technical Tickets" id="tech-tickets-section">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Technical Tickets</h3>
                <p className="text-xs text-slate-500">Open technical issues</p>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('/lead/tickets')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasTickets ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Ticket</th>
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Assigned To</th>
                    <th className="pb-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70" />
              </table>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                <Ticket className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No tickets available</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Technical tickets will appear here once created.</p>
            </div>
          )}
        </div>
      </section>

      {/* Team Performance + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <section aria-label="Team Performance" id="tech-performance-section">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Team Performance</h3>
                    <p className="text-xs text-slate-500">Engineering metrics overview</p>
                  </div>
                </div>
              </div>

              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                  <GitBranch className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-semibold text-slate-600">No performance data available</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Engineering metrics will appear here once data is available.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-6">
          <section aria-label="Recent Activity" id="tech-activity-section">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                    <p className="text-xs text-slate-500">Latest tech team events</p>
                  </div>
                </div>
                <button type="button" onClick={() => onNavigate('/lead/tickets')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {!hasActivities ? (
                <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                    <Activity className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No recent activity</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tech events will appear here once recorded.</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Actions */}
      <section aria-label="Quick Actions" id="tech-quick-actions-bar">
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Tasks', icon: <ListTodo className="w-4 h-4 text-amber-600" />, route: '/lead/tasks', hoverBorder: 'hover:border-amber-200 hover:bg-amber-500/[0.04]' },
            { label: 'View Projects', icon: <FolderKanban className="w-4 h-4 text-emerald-600" />, route: '/lead/projects', hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-500/[0.04]' },
            { label: 'View Tickets', icon: <Ticket className="w-4 h-4 text-purple-600" />, route: '/lead/tickets', hoverBorder: 'hover:border-purple-300 hover:bg-purple-500/[0.04]' },
            { label: 'Team Attendance', icon: <Clock className="w-4 h-4 text-indigo-600" />, route: '/lead/attendance', hoverBorder: 'hover:border-indigo-200 hover:bg-indigo-500/[0.04]' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(item.route)}
              className={`p-3 rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200/80 text-left transition-all flex items-center gap-3 group cursor-pointer ${item.hoverBorder}`}
            >
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};
