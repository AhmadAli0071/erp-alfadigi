import React, { useState } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import {
  CalendarDays,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ListFilter,
  BookOpen,
  Plus,
} from 'lucide-react';

interface LeadLeaveViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
}

const STATUS_OPTIONS = ['ALL', 'Pending', 'Approved', 'Rejected'];
const LEAVE_TYPES = ['ALL', 'Annual', 'Sick', 'Personal', 'Unpaid', 'Maternity', 'Paternity'];

export const LeadLeaveView: React.FC<LeadLeaveViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasData = false;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn" id="lead-leave-view">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/lead/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team leave requests</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer" title="Export">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer" title="Refresh">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: '—', icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'Approved', value: '—', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
          { label: 'Rejected', value: '—', icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
          { label: 'Total Requests', value: '—', icon: <CalendarDays className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-500/[0.04] border-indigo-200' },
        ].map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {card.icon}
              <span className="text-xs font-medium text-slate-700">{card.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Leave Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="sm:hidden p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {hasData ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">From</th>
                  <th className="px-5 py-3.5">To</th>
                  <th className="px-5 py-3.5">Days</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70" />
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CalendarDays className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No leave requests available</p>
          <p className="text-xs text-slate-400">Leave requests from your team will appear here.</p>
        </div>
      )}

      {/* Approval Info Banner */}
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-200 shrink-0">
          <BookOpen className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-900 mb-0.5">Approval Workflow</p>
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            Leave requests follow the approval chain: Employee &rarr; Lead &rarr; HR. As a Lead, you can approve or reject requests from your team members. Final approval for certain leave types may require HR review.
          </p>
        </div>
      </div>
    </div>
  );
};
