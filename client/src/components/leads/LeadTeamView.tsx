import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import {
  Users,
  ArrowLeft,
  Search,
  Mail,
  Phone,
  Calendar,
  Building2,
  UserRound,
  RefreshCw,
  Shield,
  Clock,
  Ticket,
  CalendarDays,
} from 'lucide-react';
import { StatusBadge } from '../hr/StatusBadge';

interface LeadTeamViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
}

interface TeamMember {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  avatar?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  joinedDate: string;
  phone?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
};

const avatarTints = [
  'bg-indigo-50 text-indigo-600 border-indigo-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-sky-50 text-sky-600 border-sky-200',
  'bg-purple-50 text-purple-600 border-purple-200',
  'bg-amber-50 text-amber-600 border-amber-200',
];

const getAvatarTint = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % avatarTints.length;
  return avatarTints[hash];
};

export const LeadTeamView: React.FC<LeadTeamViewProps> = ({
  user,
  onNavigate,
}) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
      const res = await fetch(`/api/employees/team/${user.email}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load team');
      const data = await res.json();
      setTeam(data.team || []);
    } catch {
      setError('Unable to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user.email]);

  const filtered = team.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.empId.toLowerCase().includes(q) ||
      m.jobTitle.toLowerCase().includes(q)
    );
  });

  const summary = {
    total: team.length,
    active: team.filter((m) => m.status === 'Active').length,
    onLeave: team.filter((m) => m.status === 'On Leave').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-fadeIn p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/lead/dashboard')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-600" />
              My Team
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Team members reporting to you — attendance, status, and details.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTeam}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
        {[
          { label: 'Total Members', value: summary.total, icon: <Users className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50 border-indigo-200' },
          { label: 'Active', value: summary.active, icon: <Shield className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200' },
          { label: 'On Leave', value: summary.onLeave, icon: <CalendarDays className="w-5 h-5 text-amber-600" />, color: 'bg-amber-50 border-amber-200' },
        ].map((card) => (
          <div key={card.label} className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.color} border`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/70">
              <h3 className="text-xs font-bold text-slate-700">{card.label}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, ID or role..."
            className="w-full text-xs font-medium rounded-xl py-2 pl-9 pr-8 bg-slate-100/70 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading team…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button
            type="button"
            onClick={fetchTeam}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            {searchQuery ? 'No matching team members' : 'No team members yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try a different search term.'
              : 'HR will assign employees to your team. They will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/80 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarTint(member.id)}`}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{member.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{member.empId}</div>
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge status={member.status} size="xs" />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{member.department}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <UserRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{member.jobTitle}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{member.email}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Joined {member.joinedDate}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/lead/attendance')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/70 text-[10px] font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3" />
                  Attendance
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/lead/tickets')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/70 text-[10px] font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Ticket className="w-3 h-3" />
                  Tickets
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/lead/leave')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/70 text-[10px] font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3 h-3" />
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
