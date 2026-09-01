import React from 'react';
import { User, UserRole } from '../../types/auth';
import { BrandLogo } from '../common/BrandLogo';
import { HRDashboardLayout } from './HRDashboardLayout';
import { LeadDashboardLayout } from '../leads/LeadDashboardLayout';
import {
  ShieldAlert,
  Users,
  Briefcase,
  UserCheck,
  LogOut,
  CheckCircle,
  Building2,
  Lock,
  ArrowLeft,
  Mail,
  BadgeAlert,
} from 'lucide-react';

interface RoleDashboardViewProps {
  user: User;
  onLogout: () => void;
}

export const RoleDashboardView: React.FC<RoleDashboardViewProps> = ({
  user,
  onLogout,
}) => {
  // If the logged-in user is HR Admin, render Screen 2: HR Admin Dashboard
  if (user.role === 'HR_ADMIN') {
    return <HRDashboardLayout user={user} onLogout={onLogout} />;
  }

  // If the logged-in user is a Department Lead, render the appropriate Lead Dashboard
  if (user.role === 'DEPARTMENT_LEAD') {
    return <LeadDashboardLayout user={user} onLogout={onLogout} />;
  }

  const getDashboardDetails = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          title: 'Super Admin Dashboard',
          subtitle: 'Global System Administration & Multi-Tenant Control',
          badge: 'Super Admin',
          badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
          icon: <ShieldAlert className="w-6 h-6 text-rose-600" />,
          permissions: [
            'Full System Configuration',
            'All Department Auditing',
            'User & Role Governance',
            'Database & Security Logs',
          ],
        };
      case 'HR_ADMIN':
        return {
          title: 'HR Dashboard',
          subtitle: 'People Operations, Attendance, Onboarding & Leave Management',
          badge: 'HR Admin',
          badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
          icon: <Users className="w-6 h-6 text-purple-600" />,
          permissions: [
            'Employee Lifecycle Management',
            'Leave Approvals & Policies',
            'Workforce Attendance Reports',
            'Payroll & Department Rosters',
          ],
        };
      case 'DEPARTMENT_LEAD':
        return {
          title: 'Lead Dashboard',
          subtitle: `${user.department || 'Department'} Operations, Team Directives & Project Tracking`,
          badge: `${user.department ? `${user.department} Lead` : 'Department Lead'}`,
          badgeColor: 'bg-sky-50 text-sky-600 border-sky-200',
          icon: <Briefcase className="w-6 h-6 text-sky-600" />,
          permissions: [
            `Team Directives (${user.department})`,
            'Resource Allocation',
            'Department Shift Sign-off',
            'Performance Metrics',
          ],
        };
      case 'EMPLOYEE':
        return {
          title: 'Employee Dashboard',
          subtitle: `Self-Service Workspace & Shift Roster (${user.department || 'General'})`,
          badge: 'Employee',
          badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: <UserCheck className="w-6 h-6 text-amber-600" />,
          permissions: [
            'My Attendance Punching',
            'My Leave Requests',
            'Personal Timesheet',
            'Company Announcements',
          ],
        };
    }
  };

  const info = getDashboardDetails(user.role);

  return (
    <div
      className="min-h-screen bg-[#F7F9FC] text-slate-700 flex flex-col justify-between"
      id="role-dashboard-container"
    >
      {/* Top Navigation Bar */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/70 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <span className="text-xs text-slate-500 font-medium">{user.jobTitle}</span>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              id="dashboard-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {/* Redirection Verification Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-800">
                Mock Authentication &amp; Role Redirection Successful
              </h2>
              <p className="text-xs sm:text-sm text-emerald-600">
                The Alfa Digi ERP auth engine routed you to the appropriate dashboard based on your role.
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline underline-offset-4 focus:outline-none cursor-pointer"
            id="return-to-login-link"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch / Test Another Persona</span>
          </button>
        </div>

        {/* Dashboard Title & Role Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/70">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-slate-100/50 border border-slate-200/80">
                {info.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" id="dashboard-role-heading">
                    {info.title}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${info.badgeColor}`}
                  >
                    {info.badge}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500">{info.subtitle}</p>
              </div>
            </div>

            {/* Department / Status Pill */}
            {user.department && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-medium self-start md:self-auto">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Department: <strong className="text-slate-900">{user.department}</strong></span>
              </div>
            )}
          </div>

          {/* User Session Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-400 block mb-1">Authenticated User</span>
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-400 block mb-1">Work Email</span>
              <span className="text-sm font-mono text-slate-600 truncate block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {user.email}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-400 block mb-1">Assigned Role Key</span>
              <span className="text-sm font-mono font-bold text-indigo-600">{user.role}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-400 block mb-1">Designation</span>
              <span className="text-sm font-semibold text-slate-700">{user.jobTitle}</span>
            </div>
          </div>
        </div>

        {/* Modular Next Phase Notification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Permission Scope for this Role */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Permission Boundaries ({user.role})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {info.permissions.map((perm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-600"
                >
                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ERP Development Roadmap Notice */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 text-slate-900 shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100/70 text-indigo-600 text-[11px] font-semibold mb-3 border border-indigo-200">
                <BadgeAlert className="w-3.5 h-3.5" />
                <span>Phase 1 Scope: Login Module</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Phase 1 Complete</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                As specified in requirements, Phase 1 delivers the production-quality Login screen, auth abstraction, and role-based redirection hooks.
              </p>
            </div>

            <button
              onClick={onLogout}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              id="dashboard-switch-account-action"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out &amp; Return to Login</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-xl border-t border-slate-200/70 py-4 px-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Alfa Digi Corp. Alfa Digi ERP — Smart Workforce &amp; Business Management.
      </footer>
    </div>
  );
};

