import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh';
import { User } from '../../types/auth';
import { ClockButtonsCard } from '../attendance/ClockButtonsCard';
import {
  Clock,
  CalendarDays,
  Ticket,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface EmployeeDashboardViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface MyStats {
  attendanceDaysThisMonth: number;
  presentDaysThisMonth: number;
  totalLeaveRequests: number;
  approvedLeaves: number;
}

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

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

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<MyStats | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, leavesRes, ticketsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/employees/me/${user.email}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/leaves/my/${user.email}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/tickets/my/${user.email}`, { headers: getHeaders() }),
      ]);
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const data = await profileRes.value.json();
        setStats(data.stats || null);
      }
      if (leavesRes.status === 'fulfilled' && leavesRes.value.ok) {
        const data = await leavesRes.value.json();
        const leaves = data.leaves || [];
        setPendingLeaves(leaves.filter((l: { status: string }) => l.status === 'Pending').length);
      }
      if (ticketsRes.status === 'fulfilled' && ticketsRes.value.ok) {
        const data = await ticketsRes.value.json();
        const tickets = data.tickets || [];
        setOpenTickets(tickets.filter((t: { status: string }) => ['Open', 'In Progress', 'Pending'].includes(t.status)).length);
      }
    } catch {
      /* non-critical overview data */
    } finally {
      setIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Live refresh: SSE notification ya window focus par overview refetch
  useRealtimeRefresh(fetchOverview);

  const kpiCards = [
    {
      label: 'Present (This Month)',
      value: stats ? `${stats.presentDaysThisMonth}/${stats.attendanceDaysThisMonth}` : '-',
      sub: 'Working days attended',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      route: '/employee/attendance',
    },
    {
      label: 'Pending Leaves',
      value: stats ? pendingLeaves : '-',
      sub: 'Awaiting approval',
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      route: '/employee/leaves',
    },
    {
      label: 'Open Tickets',
      value: stats ? openTickets : '-',
      sub: 'In progress or unresolved',
      icon: <Ticket className="w-4 h-4" />,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      route: '/employee/tickets',
    },
    {
      label: 'Approved Leaves',
      value: stats ? stats.approvedLeaves : '-',
      sub: 'All time',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      route: '/employee/leaves',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {getFormattedDate()}
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={isLoading}
          className="self-start p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Clock Buttons Card (shared) */}
      <ClockButtonsCard user={user} />

      {/* My Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">My Overview</h3>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Live</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(card.route)}
              className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm text-left hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`inline-flex p-2 rounded-lg border mb-2.5 ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-lg font-extrabold text-slate-900 leading-none">{card.value}</div>
              <div className="text-[11px] font-bold text-slate-700 mt-1.5">{card.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{card.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'View Attendance', icon: <Clock className="w-4 h-4" />, route: '/employee/attendance', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { label: 'Request Leave', icon: <CalendarDays className="w-4 h-4" />, route: '/employee/leaves', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Create Ticket', icon: <Ticket className="w-4 h-4" />, route: '/employee/tickets', color: 'text-rose-600 bg-rose-50 border-rose-200' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.route)}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${action.color}`}>
                  {action.icon}
                </div>
                <span className="text-xs font-bold text-slate-700">{action.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
