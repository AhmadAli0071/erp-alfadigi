import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import { ClockButtonsCard } from '../attendance/ClockButtonsCard';
import {
  Calendar,
  Users,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Clock,
  Ticket as TicketIcon,
  Zap,
  ChevronRight,
  CalendarDays,
  WifiOff,
  Coffee,
} from 'lucide-react';

interface LeadDashboardHomeViewProps {
  user: User;
  department: string;
  onNavigate: (route: string) => void;
}

interface TeamMember {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  status: string;
}

interface TeamAttendanceRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  jobTitle: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workingMinutes: number;
  status: string;
}

interface TeamLeave {
  id: string;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface TeamTicket {
  id: string;
  ticketCode: string;
  subject: string;
  employeeName: string;
  employeeCode: string;
  ticketType: string;
  priority: string;
  status: string;
  createdAt: string;
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

const localToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const PRESENT_STATUSES = ['Present', 'Late', 'Short Hours', 'On Duty', 'Pending OT'];
const ACTIVE_TICKET_STATUSES = ['Open', 'Pending', 'In Progress', 'HR In Process'];

const statusChip = (status: string): { cls: string } => {
  switch (status) {
    case 'Present':
    case 'Final Approved':
      return { cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    case 'Late':
    case 'Short Hours':
      return { cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    case 'Absent':
    case 'Rejected':
      return { cls: 'bg-rose-50 text-rose-600 border-rose-200' };
    case 'On Leave':
    case 'Leave':
      return { cls: 'bg-blue-50 text-blue-600 border-blue-200' };
    case 'Pending':
      return { cls: 'bg-orange-50 text-orange-600 border-orange-200' };
    case 'Approved':
      return { cls: 'bg-teal-50 text-teal-600 border-teal-200' };
    case 'Open':
      return { cls: 'bg-sky-50 text-sky-600 border-sky-200' };
    case 'In Progress':
    case 'HR In Process':
      return { cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
    case 'In Process':
      return { cls: 'bg-violet-50 text-violet-600 border-violet-200' };
    case 'Resolved':
      return { cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    default:
      return { cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
};

const Chip: React.FC<{ status: string }> = ({ status }) => {
  const { cls } = statusChip(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
};

export const LeadDashboardHomeView: React.FC<LeadDashboardHomeViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [attendance, setAttendance] = useState<TeamAttendanceRow[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<TeamLeave[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [tickets, setTickets] = useState<TeamTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [teamRes, attRes, pendingRes, leavesRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE}/employees/team/${user.email}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/attendance/team/${user.email}?date=${localToday()}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/leaves/pending-count/${user.email}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/leaves/team/${user.email}?status=Pending`, { headers: getHeaders() }),
        fetch(`${API_BASE}/tickets/team/${user.email}`, { headers: getHeaders() }),
      ]);

      if (teamRes.ok) {
        const d = await teamRes.json();
        setTeam(d.team || []);
      }
      if (attRes.ok) {
        const d = await attRes.json();
        setAttendance(d.team || []);
      }
      if (pendingRes.ok) {
        const d = await pendingRes.json();
        setPendingLeavesCount(d.count || 0);
      }
      if (leavesRes.ok) {
        const d = await leavesRes.json();
        setPendingLeaves((d.leaves || []).slice(0, 5));
      }
      if (ticketsRes.ok) {
        const d = await ticketsRes.json();
        setTickets((d.tickets || []).filter((t: TeamTicket) => ACTIVE_TICKET_STATUSES.includes(t.status)).slice(0, 5));
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const presentToday = attendance.filter((r) => PRESENT_STATUSES.includes(r.status)).length;
  const onBreak = attendance.filter((r) => r.status !== 'Absent' && !r.clockOut && r.breakMinutes > 0).length;
  const openTickets = tickets.length;

  const isLoadingState = isLoading;

  if (isLoadingState) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-16 rounded-2xl bg-white/60 border border-slate-200/60 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/60 border border-slate-200/60 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/60 border border-slate-200/60 animate-pulse" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-12 text-center">
          <WifiOff className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">Unable to load dashboard.</p>
          <button
            onClick={fetchDashboard}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Team Members',
      value: team.length,
      context: `${department} team`,
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      tagLabel: 'Active',
      tagColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Present Today',
      value: presentToday,
      context: `${team.length - presentToday} not clocked in`,
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      tagLabel: 'On Duty',
      tagColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Pending Leaves',
      value: pendingLeavesCount,
      context: 'Awaiting your approval',
      icon: <Calendar className="w-5 h-5 text-orange-600" />,
      tagLabel: pendingLeavesCount > 0 ? 'Action Needed' : 'Clear',
      tagColor: pendingLeavesCount > 0 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Open Tickets',
      value: openTickets,
      context: 'Active in queue',
      icon: <TicketIcon className="w-5 h-5 text-purple-600" />,
      tagLabel: openTickets > 0 ? 'Open' : 'Clear',
      tagColor: openTickets > 0 ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="lead-dashboard-home">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user.name?.split(' ')[0] || `${department} Lead`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Here's your {department.toLowerCase()} team overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-900">{getFormattedDate()}</span>
        </div>
      </div>

      {/* My Attendance — Clock In/Out (lead is an employee too) */}
      <ClockButtonsCard user={user} title="My Shift Today" />

      {/* KPI Cards — REAL */}
      <section aria-label="Team KPI Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {kpis.map((card, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (card.title === 'Pending Leaves') onNavigate('/lead/leave');
                if (card.title === 'Open Tickets') onNavigate('/lead/tickets');
                if (card.title === 'Present Today') onNavigate('/lead/attendance');
                if (card.title === 'Team Members') onNavigate('/lead/team');
              }}
              className="group p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
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

      {/* Requires Your Attention — REAL counts */}
      <section aria-label="Requires Your Attention" className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Leaves card */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/80 transition-all flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${pendingLeavesCount > 0 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {pendingLeavesCount > 0 ? `${pendingLeavesCount} pending` : 'All clear'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Leave Requests</h4>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                {pendingLeavesCount > 0
                  ? `${pendingLeavesCount} team leave request${pendingLeavesCount === 1 ? '' : 's'} pending your approval.`
                  : 'No leave requests waiting for your review.'}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <button type="button" onClick={() => onNavigate('/lead/leave')} className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                View all &rarr;
              </button>
              <button type="button" onClick={() => onNavigate('/lead/leave')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${pendingLeavesCount > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span>Review</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Open Tickets card */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/80 transition-all flex flex-col justify-between shadow-sm group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:scale-105 transition-transform">
                  <TicketIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${openTickets > 0 ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {openTickets > 0 ? `${openTickets} open` : 'All clear'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Team Tickets</h4>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                {openTickets > 0
                  ? `${openTickets} ticket${openTickets === 1 ? '' : 's'} currently active in your team queue.`
                  : 'No active tickets in your team queue.'}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <button type="button" onClick={() => onNavigate('/lead/tickets')} className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                View all &rarr;
              </button>
              <button type="button" onClick={() => onNavigate('/lead/tickets')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${openTickets > 0 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span>Review</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Attendance Today — REAL */}
      <section aria-label="Team Attendance">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{department} Team Attendance</h3>
                <p className="text-xs text-slate-500">Today's attendance overview</p>
              </div>
            </div>
            <button type="button" onClick={() => onNavigate('/lead/attendance')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {attendance.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Employee</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Clock In</th>
                    <th className="pb-3 pr-4">Working</th>
                    <th className="pb-3">Break</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {attendance.map((row) => (
                    <tr key={row.employeeId} className="group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {row.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{row.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{row.employeeCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><Chip status={row.status} /></td>
                      <td className="py-3 pr-4 text-xs font-mono text-slate-600">{row.clockIn || '—'}</td>
                      <td className="py-3 pr-4 text-xs font-mono font-bold text-slate-700">
                        {row.clockOut ? formatMinutes(row.workingMinutes) : row.clockIn ? 'Live' : '—'}
                      </td>
                      <td className="py-3 text-xs font-mono text-slate-500">
                        {row.breakMinutes > 0 ? formatMinutes(row.breakMinutes) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                <Users className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No team members yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Attendance will appear once HR assigns members to your team.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pending Leaves + Open Tickets lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pending Leave Requests */}
        <div className="lg:col-span-6">
          <section aria-label="Pending Leave Requests">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pending Leave Requests</h3>
                    <p className="text-xs text-slate-500">Waiting for your approval</p>
                  </div>
                </div>
                <button type="button" onClick={() => onNavigate('/lead/leave')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingLeaves.length > 0 ? (
                <div className="mt-4 space-y-3 flex-1">
                  {pendingLeaves.map((lv) => (
                    <div key={lv.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-200 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {lv.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{lv.employeeName}</span>
                          <Chip status={lv.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {lv.leaveType} · {fmtDate(lv.startDate)} → {fmtDate(lv.endDate)} ({lv.totalDays}d)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('/lead/leave')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                        title="Review"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center my-auto flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                    <CalendarDays className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No pending leave requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Open Tickets */}
        <div className="lg:col-span-6">
          <section aria-label="Open Tickets">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <TicketIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Open Tickets</h3>
                    <p className="text-xs text-slate-500">Active tickets in your queue</p>
                  </div>
                </div>
                <button type="button" onClick={() => onNavigate('/lead/tickets')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {tickets.length > 0 ? (
                <div className="mt-4 space-y-3 flex-1">
                  {tickets.map((tk) => (
                    <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-purple-200 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {tk.ticketCode?.replace('TKT-', '').slice(-2) || 'TK'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{tk.subject}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">{tk.ticketCode}</span>
                          <span className="text-[10px] text-slate-400">· {tk.employeeName}</span>
                          <Chip status={tk.status} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('/lead/tickets')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                        title="View"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center my-auto flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 text-slate-400">
                    <TicketIcon className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No open tickets</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Team tickets will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Actions — REAL routes only */}
      <section aria-label="Quick Actions">
        <div className="flex items-center gap-2 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'My Team', icon: <Users className="w-4 h-4 text-indigo-600" />, route: '/lead/team', hoverBorder: 'hover:border-indigo-200 hover:bg-indigo-500/[0.04]' },
            { label: 'Team Attendance', icon: <Clock className="w-4 h-4 text-emerald-600" />, route: '/lead/attendance', hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-500/[0.04]' },
            { label: 'Leave Approvals', icon: <CalendarDays className="w-4 h-4 text-blue-600" />, route: '/lead/leave', hoverBorder: 'hover:border-blue-200 hover:bg-blue-500/[0.04]' },
            { label: 'Team Tickets', icon: <TicketIcon className="w-4 h-4 text-purple-600" />, route: '/lead/tickets', hoverBorder: 'hover:border-purple-300 hover:bg-purple-500/[0.04]' },
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

      {/* On Break summary strip (only when someone is on break) */}
      {onBreak > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-700">
          <Coffee className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            {onBreak} team member{onBreak === 1 ? ' is' : 's are'} currently on break.
          </span>
        </div>
      )}
    </div>
  );
};
