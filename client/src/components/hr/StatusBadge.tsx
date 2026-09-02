import React from 'react';
import {
  AttendanceStatus,
  RequestStatus,
} from '../../types/hr';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Briefcase,
  AlertCircle,
  Calendar,
  Sparkles,
  MinusCircle,
  Sun,
  ShieldCheck,
  Ban,
} from 'lucide-react';

export type AnyBadgeStatus = AttendanceStatus | RequestStatus | 'Active' | 'Inactive' | 'Open' | 'Short Hours' | 'Pending OT';

interface StatusBadgeProps {
  status: AnyBadgeStatus | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Present':
      case 'Approved':
      case 'Active':
        return {
          bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          dot: 'bg-emerald-500',
        };
      case 'Absent':
      case 'Rejected':
      case 'Inactive':
        return {
          bg: 'bg-rose-50 text-rose-600 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          dot: 'bg-rose-500',
        };
      case 'Late':
        return {
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          dot: 'bg-amber-400',
        };
      case 'Short Hours':
        return {
          bg: 'bg-orange-50 text-orange-600 border-orange-200',
          icon: <MinusCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
          dot: 'bg-orange-500',
        };
      case 'Pending OT':
        return {
          bg: 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-1 ring-indigo-500/20',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
          dot: 'bg-indigo-500 animate-pulse',
        };
      case 'Half Day':
        return {
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          icon: <Sun className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
          dot: 'bg-purple-500',
        };
      case 'Leave':
        return {
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          dot: 'bg-blue-500',
        };
      case 'On Leave':
        return {
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          dot: 'bg-blue-500',
        };
      case 'Work From Home':
        return {
          bg: 'bg-sky-50 text-sky-600 border-sky-200',
          icon: <Home className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
          dot: 'bg-sky-500',
        };
      case 'On Duty':
        return {
          bg: 'bg-teal-50 text-teal-600 border-teal-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
          dot: 'bg-teal-500',
        };
      case 'Holiday':
      case 'Weekend':
        return {
          bg: 'bg-slate-100 text-slate-500 border-slate-200',
          icon: <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
          dot: 'bg-slate-400',
        };
      case 'Pending':
      case 'Open':
        return {
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'In Process':
      case 'HR In Process':
      case 'In Progress':
        return {
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          dot: 'bg-blue-500 animate-pulse',
        };
      case 'Final Approved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          dot: 'bg-emerald-500',
        };
      case 'Resolved':
        return {
          bg: 'bg-teal-50 text-teal-600 border-teal-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
          dot: 'bg-teal-500',
        };
      case 'Closed':
        return {
          bg: 'bg-slate-200/50 text-slate-500 border-slate-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
          dot: 'bg-slate-400',
        };
      default:
        return {
          bg: 'bg-slate-200 text-slate-600 border-slate-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    md: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-tight select-none whitespace-nowrap transition-colors ${config.bg} ${sizeClasses[size]} ${className}`}
      id={`status-badge-${status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      {showIcon && config.icon}
      <span>{status}</span>
    </span>
  );
};
