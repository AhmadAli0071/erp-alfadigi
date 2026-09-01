import React from 'react';
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
} from 'lucide-react';

interface EmployeeProfileViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  user,
  onNavigate,
}) => {
  const profileFields = [
    { label: 'Employee ID', value: user.id || '—', icon: <Shield className="w-4 h-4 text-indigo-600" /> },
    { label: 'Full Name', value: user.name, icon: <UserIcon className="w-4 h-4 text-indigo-600" /> },
    { label: 'Email', value: user.email, icon: <Mail className="w-4 h-4 text-indigo-600" /> },
    { label: 'Department', value: user.department || '—', icon: <Building className="w-4 h-4 text-indigo-600" /> },
    { label: 'Designation', value: user.jobTitle, icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
    { label: 'Role', value: user.role, icon: <Shield className="w-4 h-4 text-indigo-600" /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn" id="employee-profile-view">

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
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{user.jobTitle}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                {user.role}
              </span>
              {user.department && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {user.department}
                </span>
              )}
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
                onClick={() => navigator.clipboard.writeText(field.value)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer shrink-0"
                title="Copy"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

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
