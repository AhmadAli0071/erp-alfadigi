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
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          dot: 'bg-emerald-400',
        };
      case 'Absent':
      case 'Rejected':
      case 'Inactive':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          dot: 'bg-rose-400',
        };
      case 'Late':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          dot: 'bg-amber-400',
        };
      case 'Short Hours':
        return {
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          icon: <MinusCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
          dot: 'bg-orange-400',
        };
      case 'Pending OT':
        return {
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 ring-1 ring-indigo-500/20',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />,
          dot: 'bg-indigo-400 animate-pulse',
        };
      case 'Half Day':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Sun className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
          dot: 'bg-purple-400',
        };
      case 'Leave':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          dot: 'bg-blue-400',
        };
      case 'Work From Home':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          icon: <Home className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          dot: 'bg-sky-400',
        };
      case 'On Duty':
        return {
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          icon: <Briefcase className="w-3.5 h-3.5 text-teal-400 shrink-0" />,
          dot: 'bg-teal-400',
        };
      case 'Holiday':
      case 'Weekend':
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          dot: 'bg-slate-400',
        };
      case 'Pending':
      case 'Open':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'Closed':
        return {
          bg: 'bg-slate-700/30 text-slate-400 border-slate-700/50',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          dot: 'bg-slate-400',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
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
