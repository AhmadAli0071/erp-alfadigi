import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  CalendarDays,
  UserX,
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronDown,
  Building2,
  Mail,
  UserRound,
  UserPlus,
  Pencil,
} from 'lucide-react';
import { hrDashboardService } from '../../services/hrDashboardService';
import { Employee, DepartmentName } from '../../types/hr';
import { StatusBadge } from '../hr/StatusBadge';
import { HRCreateUserModal } from '../hr/HRCreateUserModal';
import { HREmployeeEditModal } from '../hr/HREmployeeEditModal';

interface HREmployeesManagementViewProps {
  onNavigateToDashboard: () => void;
}

type StatusFilter = 'ALL' | Employee['status'];
type DepartmentFilter = 'ALL' | DepartmentName;

const DEPARTMENTS: DepartmentName[] = ['HR', 'Sales', 'Tech'];
const STATUSES: Employee['status'][] = ['Active', 'On Leave', 'Inactive'];

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
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

const formatValue = (val: number) => (val > 0 ? val : '—');

export const HREmployeesManagementView: React.FC<HREmployeesManagementViewProps> = ({
  onNavigateToDashboard,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState<DepartmentFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const fetchEmployees = async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      const response = await hrDashboardService.getDashboardData();
      setEmployees(response.employees);
    } catch {
      setError('Unable to load the employee directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(true);
  }, []);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || department !== 'ALL' || status !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartment('ALL');
    setStatus('ALL');
  };

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesQuery =
        !query ||
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.empId.toLowerCase().includes(query) ||
        emp.jobTitle.toLowerCase().includes(query);
      const matchesDepartment = department === 'ALL' || emp.department === department;
      const matchesStatus = status === 'ALL' || emp.status === status;
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, department, status]);

  const summary = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === 'Active').length,
      onLeave: employees.filter((e) => e.status === 'On Leave').length,
      inactive: employees.filter((e) => e.status === 'Inactive').length,
    }),
    [employees]
  );

  const summaryCards = [
    {
      id: 'emp-kpi-total',
      label: 'Total Employees',
      value: formatValue(summary.total),
      context: 'All departments',
      icon: <Users className="w-5 h-5 text-indigo-600" />,
    },
    {
      id: 'emp-kpi-active',
      label: 'Active',
      value: formatValue(summary.active),
      context: 'Currently working',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'emp-kpi-onleave',
      label: 'On Leave',
      value: formatValue(summary.onLeave),
      context: 'Approved absence',
      icon: <CalendarDays className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'emp-kpi-inactive',
      label: 'Inactive',
      value: formatValue(summary.inactive),
      context: 'Disabled accounts',
      icon: <UserX className="w-5 h-5 text-slate-500" />,
    },
  ];

  const selectTriggerClass =
    'appearance-none w-full sm:w-auto pl-9 pr-8 py-2 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer';

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="hr-employees-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 md:hidden"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-600" />
              Employee Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage staff profiles, department assignments, and onboarding records.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowCreateUserModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Employee</span>
          </button>
          <button
            type="button"
            onClick={() => fetchEmployees(true)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
            title="Refresh directory"
            id="employees-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" id="employees-summary-cards">
        {summaryCards.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-slate-300/80 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-2 rounded-xl bg-slate-100/50 border border-slate-200/70">
                {card.icon}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/70">
              <h3 className="text-xs font-bold text-slate-700 truncate">{card.label}</h3>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{card.context}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div
        className="p-3 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center gap-3"
        id="employees-filter-bar"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, ID or role..."
            className="w-full text-xs font-medium rounded-xl py-2 pl-9 pr-8 bg-slate-100/70 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            id="employees-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="relative">
          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as DepartmentFilter)}
            className={selectTriggerClass}
            id="employees-department-filter"
            aria-label="Filter by department"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <UserRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={selectTriggerClass}
            id="employees-status-filter"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
            id="employees-reset-filters-btn"
          >
            Reset
          </button>
        )}
      </div>

      {/* Content: Skeleton / Error / Empty / Table */}
      {isLoading ? (
        <div className="space-y-3" id="employees-skeleton">
          <div className="h-12 rounded-2xl skeleton-shimmer border border-slate-200/60" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl skeleton-shimmer border border-slate-200/60" />
          ))}
        </div>
      ) : error ? (
        <div
          className="p-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-rose-200 text-center space-y-4 shadow-sm"
          id="employees-error-state"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Connection Issue</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => fetchEmployees(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading</span>
          </button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div
          className="py-16 px-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 text-center space-y-4 shadow-sm"
          id="employees-empty-state"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100/60 border border-slate-200/80 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {hasActiveFilters ? 'No matching employees' : 'No employees yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {hasActiveFilters
                ? 'No employee records match your current search and filter criteria.'
                : 'Employee profiles will appear here once records are added to the system.'}
            </p>
          </div>
          <button
            type="button"
            onClick={hasActiveFilters ? handleResetFilters : () => fetchEmployees(true)}
            className="px-5 py-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            {hasActiveFilters ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div
            className="hidden md:block rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm overflow-hidden"
            id="employees-table-container"
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse" id="employees-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-semibold text-[10px] select-none">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Reports To</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Joined</th>
                    <th className="py-3 px-3 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                      id={`employee-row-${emp.id}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarTint(emp.id)}`}
                          >
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              getInitials(emp.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{emp.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{emp.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-medium text-slate-600">{emp.department}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-medium text-slate-600 truncate block max-w-[180px]">
                          {emp.jobTitle}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {emp.reportedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">
                              {emp.reportedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-slate-500 truncate block max-w-[200px]">
                          {emp.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-slate-500 whitespace-nowrap">{emp.joinedDate}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <StatusBadge status={emp.status} size="xs" />
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit employee"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer count */}
            <div className="px-4 py-3 border-t border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
              <span id="employees-table-count">
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                <span>Directory synced</span>
              </span>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3" id="employees-mobile-cards">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                id={`employee-card-${emp.id}`}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarTint(emp.id)}`}
                    >
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        getInitials(emp.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{emp.empId}</div>
                    </div>
                  </div>
                  <StatusBadge status={emp.status} size="xs" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-slate-400 text-[10px] mb-0.5">Department</div>
                    <div className="font-semibold text-slate-700">{emp.department}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="text-slate-400 text-[10px] mb-0.5">Joined</div>
                    <div className="font-semibold text-slate-700">{emp.joinedDate}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                  <UserRound className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.jobTitle}</span>
                </div>
                {emp.reportedTo && (
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                    <span className="w-3 h-3 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </span>
                    <span>Reports to <span className="font-semibold text-slate-700">{emp.reportedTo.name}</span></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showCreateUserModal && (
        <HRCreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onUserCreated={() => fetchEmployees(false)}
        />
      )}

      {editingEmployee && (
        <HREmployeeEditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdated={() => fetchEmployees(false)}
        />
      )}
    </div>
  );
};
