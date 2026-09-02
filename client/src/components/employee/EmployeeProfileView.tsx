import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Shield,
  Copy,
  CheckCircle2,
  Loader2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface EmployeeProfileViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface MyProfile {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  joinedDate: string;
  status: string;
  reportedTo: {
    id: string;
    name: string;
    empId: string;
    jobTitle: string;
    department: string;
    email: string;
  } | null;
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

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  user,
  onNavigate,
}) => {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/employees/me/${user.email}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProfile(data.employee);
      setStats(data.stats);
    } catch {
      setError('Unable to load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCopy = (value: string, idx: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error || 'Profile not found.'}</p>
          <button onClick={fetchProfile} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: 'Employee ID', value: profile.empId, icon: <Shield className="w-4 h-4 text-indigo-600" /> },
    { label: 'Full Name', value: profile.name, icon: <UserIcon className="w-4 h-4 text-indigo-600" /> },
    { label: 'Email', value: profile.email, icon: <Mail className="w-4 h-4 text-indigo-600" /> },
    { label: 'Phone', value: profile.phone || 'Not added', icon: <Phone className="w-4 h-4 text-indigo-600" /> },
    { label: 'Department', value: profile.department, icon: <Building className="w-4 h-4 text-indigo-600" /> },
    { label: 'Designation', value: profile.jobTitle, icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
    {
      label: 'Joined Date',
      value: profile.joinedDate
        ? new Date(profile.joinedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
      icon: <Calendar className="w-4 h-4 text-indigo-600" />,
    },
    { label: 'Status', value: profile.status, icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/employee/dashboard')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Your personal information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Avatar & Name */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-200/70">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-2xl">
            {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{profile.jobTitle}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                {profile.empId}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {profile.department}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {profileFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 shrink-0">
                {field.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{field.label}</p>
                <p className="text-xs font-bold text-slate-900 truncate">{field.value}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(field.value, idx)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer shrink-0"
                title="Copy"
              >
                {copiedIdx === idx ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting Lead */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          Reporting To
        </h3>
        {profile.reportedTo ? (
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200/70">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
              {profile.reportedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">{profile.reportedTo.name}</p>
              <p className="text-[11px] text-slate-500">
                {profile.reportedTo.jobTitle} · {profile.reportedTo.department} ({profile.reportedTo.empId})
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(profile.reportedTo!.email, 99)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/70 transition-colors cursor-pointer shrink-0"
              title="Copy lead email"
            >
              {copiedIdx === 99 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
            <p className="text-xs text-slate-500 font-medium">No lead assigned yet — HR will assign one soon.</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Attendance (Month)', value: `${stats.presentDaysThisMonth}/${stats.attendanceDaysThisMonth}`, color: 'text-emerald-600' },
            { label: 'Leave Requests', value: stats.totalLeaveRequests, color: 'text-indigo-600' },
            { label: 'Approved Leaves', value: stats.approvedLeaves, color: 'text-blue-600' },
            { label: 'Rejected Leaves', value: stats.totalLeaveRequests - stats.approvedLeaves, color: 'text-slate-500' },
          ].map((s, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm text-center">
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-200 shrink-0">
          <Shield className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-900 mb-0.5">Profile Information</p>
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            Your profile information is managed by HR. If you need to update any details, please contact your HR administrator.
          </p>
        </div>
      </div>
    </div>
  );
};
