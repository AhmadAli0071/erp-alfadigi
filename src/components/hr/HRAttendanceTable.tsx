import React, { useState, useMemo } from 'react';
import { AttendanceRecord, DepartmentName } from '../../types/hr';
import { StatusBadge } from './StatusBadge';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Sparkles,
  Clock,
  Building,
  ChevronRight,
  Download,
  Moon,
  Info,
} from 'lucide-react';

interface HRAttendanceTableProps {
  records: AttendanceRecord[];
  onViewDetails?: (record: AttendanceRecord) => void;
  onVerifyOvertime?: (record: AttendanceRecord) => void;
  onNavigate?: (route: string) => void;
  initialDepartmentFilter?: string;
  initialStatusFilter?: string;
}

export const HRAttendanceTable: React.FC<HRAttendanceTableProps> = ({
  records,
  onViewDetails,
  onVerifyOvertime,
  onNavigate,
  initialDepartmentFilter = 'ALL',
  initialStatusFilter = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartmentFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);
  const [sortField, setSortField] = useState<keyof AttendanceRecord>('employeeName');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter and sort records
  const processedRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Department filter
        if (selectedDept !== 'ALL' && rec.department !== selectedDept) return false;
        // Status filter
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'Late' && rec.status !== 'Late' && rec.status !== 'Short Hours') return false;
          if (selectedStatus !== 'Late' && rec.status !== selectedStatus) return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            rec.employeeName.toLowerCase().includes(q) ||
            rec.employeeCode.toLowerCase().includes(q) ||
            rec.department.toLowerCase().includes(q) ||
            rec.status.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [records, selectedDept, selectedStatus, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof AttendanceRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getDepartmentBadge = (dept: DepartmentName) => {
    switch (dept) {
      case 'HR':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'Sales':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'Tech':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    }
  };

  return (
    <section
      className="bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5"
      aria-label="Today's Attendance Records"
      id="today-attendance-table-container"
    >
      {/* Table Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight" id="attendance-table-title">
              Today's Attendance
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              {processedRecords.length} records
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time shift punches (6:00 PM – 3:00 AM) • Midnight crossover displayed with date markers
          </p>
        </div>

        {/* Top Right Action & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search in table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5 pl-8 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              id="attendance-table-search-input"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="attendance-dept-filter"
          >
            <option value="ALL" className="bg-[#121318]">All Departments</option>
            <option value="HR" className="bg-[#121318]">HR</option>
            <option value="Sales" className="bg-[#121318]">Sales</option>
            <option value="Tech" className="bg-[#121318]">Tech</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            id="attendance-status-filter"
          >
            <option value="ALL" className="bg-[#121318]">All Statuses</option>
            <option value="Present" className="bg-[#121318]">Present</option>
            <option value="Late" className="bg-[#121318]">Late / Short</option>
            <option value="Pending OT" className="bg-[#121318]">Pending OT</option>
            <option value="Work From Home" className="bg-[#121318]">Work From Home</option>
            <option value="Half Day" className="bg-[#121318]">Half Day</option>
            <option value="Leave" className="bg-[#121318]">Leave</option>
            <option value="Absent" className="bg-[#121318]">Absent</option>
          </select>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/hr/attendance/history')}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
              id="view-all-attendance-btn"
            >
              View All
            </button>
          )}
        </div>
      </div>

      {/* Midnight Shift Clarification Note (Section 22) */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
        <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-slate-300">Overnight Shift Display:</strong> Attendance date is recorded as{' '}
          <strong className="text-white">31 Aug</strong>. Morning punches after midnight display <span className="font-mono text-indigo-300">01 Sep</span>.
        </span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 custom-scrollbar">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold text-[10px] select-none">
              <th
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('employeeName')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Department</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Clock In</th>
              <th className="py-3 px-3">Clock Out</th>
              <th className="py-3 px-3">Break</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('workingHours')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Working Hours</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Extra Hours</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 font-medium">
            {processedRecords.length > 0 ? (
              processedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                  id={`attendance-row-${record.id}`}
                >
                  {/* Employee Name + Code */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                        {record.employeeName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors">
                          {record.employeeName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          {record.employeeCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDepartmentBadge(record.department)}`}>
                      {record.department}
                    </span>
                  </td>

                  {/* Clock In */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    {record.clockInTime !== '—' ? (
                      <div>
                        <span className="text-slate-200">{record.clockInTime}</span>
                        <span className="text-[9px] text-slate-500 ml-1">({record.clockInDate})</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Clock Out (with overnight date marker) */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    {record.clockOutTime !== '—' ? (
                      <div>
                        <span className="text-slate-200">{record.clockOutTime}</span>
                        <span className="text-[9px] font-semibold text-indigo-400 ml-1">
                          ({record.clockOutDate})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Break */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {record.breakDuration}
                  </td>

                  {/* Working Hours */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    <span className={`font-bold ${record.workingHours >= '08:00' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {record.workingHours}
                    </span>
                  </td>

                  {/* Extra Hours */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                    {record.extraHours !== '00:00' ? (
                      <span className="font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        +{record.extraHours}
                      </span>
                    ) : (
                      <span className="text-slate-600">00:00</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={record.status} size="xs" />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {record.status === 'Pending OT' && onVerifyOvertime && (
                        <button
                          type="button"
                          onClick={() => onVerifyOvertime(record)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Verify detected extra time"
                        >
                          Verify OT
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetails && onViewDetails(record)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="View employee shift details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  No attendance records matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
