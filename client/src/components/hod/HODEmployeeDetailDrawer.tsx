import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User as UserIcon,
  Wallet,
  CalendarDays,
  Inbox,
  Ticket,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  Clock,
} from 'lucide-react';

interface HODEmployeeDetailDrawerProps {
  email: string;
  name: string;
  onClose: () => void;
}

interface ProfileData {
  employee: {
    id: string;
    empId: string;
    name: string;
    email: string;
    phone?: string;
    department: string;
    jobTitle: string;
    joinedDate?: string;
    status: string;
    salary?: { base: number; currency?: string };
    reportedTo?: { name: string; empId: string; jobTitle: string; department: string } | null;
  };
  stats: {
    attendanceDaysThisMonth: number;
    presentDaysThisMonth: number;
    totalLeaveRequests: number;
    approvedLeaves: number;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workingMinutes: number;
  status: string;
}

interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
}

interface TicketRecord {
  id: string;
  ticketCode: string;
  subject: string;
  ticketType: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface SalaryRow {
  baseSalary: number;
  expectedMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  paidLeaveDays: number;
  countableMinutes: number;
  payable: number;
  finalPayable: number;
  deduction: number;
  adjustments?: { id: string; type: string; amount: number; reason: string }[];
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

const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fmtHM = (mins: number): string => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusChip = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Approved':
    case 'Final Approved':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'Closed':
    case 'Cancelled':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    case 'Open':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default:
      return 'bg-blue-50 text-blue-600 border-blue-200';
  }
};

type TabKey = 'personal' | 'salary' | 'attendance' | 'leaves' | 'tickets';

export const HODEmployeeDetailDrawer: React.FC<HODEmployeeDetailDrawerProps> = ({ email, name, onClose }) => {
  const [tab, setTab] = useState<TabKey>('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [salaryRow, setSalaryRow] = useState<SalaryRow | null>(null);
  const [salaryMonth, setSalaryMonth] = useState(currentMonthKey());
  const [salaryEmpty, setSalaryEmpty] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const month = tab === 'salary' ? salaryMonth : currentMonthKey();
    try {
      const [profileRes, attRes, leaveRes, ticketRes, salaryRes] = await Promise.all([
        fetch(`${API_BASE}/employees/my/${encodeURIComponent(email)}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/attendance/history/${encodeURIComponent(email)}?days=31`, { headers: getHeaders() }),
        fetch(`${API_BASE}/leaves/my/${encodeURIComponent(email)}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/tickets/my/${encodeURIComponent(email)}`, { headers: getHeaders() }),
        fetch(`${API_BASE}/salary-calc/month?month=${month}&search=${encodeURIComponent(email)}`, { headers: getHeaders() }),
      ]);

      if (!profileRes.ok) throw new Error('Failed');
      const profileData = await profileRes.json();
      setProfile(profileData);

      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData.records || []);
      }
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData.leaves || []);
      }
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTickets(ticketData.tickets || []);
      }
      if (salaryRes.ok) {
        const salaryData = await salaryRes.json();
        const row = (salaryData.rows || []).find((r: SalaryRow & { email?: string }) => (r.email || '').toLowerCase() === email.toLowerCase());
        setSalaryRow(row || null);
        setSalaryEmpty(!row);
      } else {
        setSalaryRow(null);
        setSalaryEmpty(true);
      }
    } catch {
      setError('Unable to load employee details.');
    } finally {
      setIsLoading(false);
    }
  }, [email, tab, salaryMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'personal', label: 'Personal', icon: <UserIcon className="w-3.5 h-3.5" /> },
    { key: 'salary', label: 'Salary', icon: <Wallet className="w-3.5 h-3.5" /> },
    { key: 'attendance', label: 'Attendance', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'leaves', label: 'Leaves', icon: <Inbox className="w-3.5 h-3.5" /> },
    { key: 'tickets', label: 'Tickets', icon: <Ticket className="w-3.5 h-3.5" /> },
  ];

  const emp = profile?.employee;
  const stats = profile?.stats;

  const presentDays = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/70 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-extrabold ring-2 ring-amber-400/40 shrink-0">
                {name.split(' ').map((p) => p[0]?.toUpperCase()).slice(0, 2).join('')}
              </div>
              <div className="min-w-0">
                <div className="text-base font-extrabold truncate">{emp?.name || name}</div>
                <div className="text-[11px] text-amber-200/80 font-semibold truncate">
                  {emp ? `${emp.jobTitle} · ${emp.empId}` : 'Loading…'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-0.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  tab === t.key ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <button onClick={fetchAll} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
            </div>
          ) : tab === 'personal' && emp ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Present This Month', value: stats?.presentDaysThisMonth ?? presentDays, icon: <BadgeCheck className="w-4 h-4 text-emerald-600" /> },
                  { label: 'Days Recorded', value: stats?.attendanceDaysThisMonth ?? attendance.length, icon: <CalendarDays className="w-4 h-4 text-indigo-600" /> },
                  { label: 'Leave Requests', value: stats?.totalLeaveRequests ?? leaves.length, icon: <Inbox className="w-4 h-4 text-amber-600" /> },
                  { label: 'Approved Leaves', value: stats?.approvedLeaves ?? 0, icon: <BadgeCheck className="w-4 h-4 text-blue-600" /> },
                ].map((k, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.icon} {k.label}</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 divide-y divide-slate-200/70">
                {[
                  { icon: <Mail className="w-4 h-4 text-slate-400" />, label: 'Email', value: emp.email },
                  { icon: <Phone className="w-4 h-4 text-slate-400" />, label: 'Phone', value: emp.phone || 'Not provided' },
                  { icon: <Building2 className="w-4 h-4 text-slate-400" />, label: 'Department', value: emp.department },
                  { icon: <UserIcon className="w-4 h-4 text-slate-400" />, label: 'Job Title', value: emp.jobTitle },
                  { icon: <CalendarDays className="w-4 h-4 text-slate-400" />, label: 'Joined', value: emp.joinedDate ? fmtDate(emp.joinedDate) : '—' },
                  { icon: <BadgeCheck className="w-4 h-4 text-slate-400" />, label: 'Status', value: emp.status },
                  { icon: <UserIcon className="w-4 h-4 text-slate-400" />, label: 'Reports To', value: emp.reportedTo ? `${emp.reportedTo.name} (${emp.reportedTo.jobTitle})` : '—' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="shrink-0">{row.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 w-32 shrink-0">{row.label}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : tab === 'salary' ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salary Overview</div>
                  <div className="text-xs text-slate-500 font-medium">Based on recorded working hours</div>
                </div>
                <select
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return (
                      <option key={key} value={key}>
                        {d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {salaryEmpty ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No salary record yet</p>
                  <p className="text-xs text-slate-400 mt-1">No calculation has been generated for this month.</p>
                </div>
              ) : !salaryRow ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Base Salary', value: salaryRow.baseSalary, cls: 'bg-slate-900 text-white' },
                      { label: 'Payable', value: salaryRow.finalPayable ?? salaryRow.payable, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                      { label: 'Deduction', value: salaryRow.deduction, cls: 'bg-rose-50 border-rose-200 text-rose-600' },
                      { label: 'OT Minutes', value: salaryRow.otMinutes, cls: 'bg-indigo-50 border-indigo-200 text-indigo-700', raw: true },
                    ].map((k, i) => (
                      <div key={i} className={`p-3.5 rounded-2xl border ${k.cls}`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{k.label}</div>
                        <div className="text-lg font-extrabold font-mono mt-0.5">{k.raw ? k.value : `$${Number(k.value || 0).toLocaleString()}`}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/70 divide-y divide-slate-200/70">
                    {[
                      { label: 'Expected Hours', value: fmtHM(salaryRow.expectedMinutes) },
                      { label: 'Worked Hours', value: fmtHM(salaryRow.workedMinutes) },
                      { label: 'Countable Hours', value: fmtHM(salaryRow.countableMinutes) },
                      { label: 'Paid Leave Days', value: String(salaryRow.paidLeaveDays || 0) },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{row.label}</span>
                        <span className="text-xs font-extrabold font-mono text-slate-800">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {salaryRow.adjustments && salaryRow.adjustments.length > 0 && (
                    <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-4 space-y-2">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Adjustments</div>
                      {salaryRow.adjustments.map((adj) => (
                        <div key={adj.id} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-700 font-medium truncate">{adj.type} — {adj.reason}</span>
                          <span className={`font-extrabold font-mono shrink-0 ${adj.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {adj.amount >= 0 ? '+' : ''}${Math.abs(adj.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : tab === 'attendance' ? (
            attendance.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No attendance records</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/70 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">In</th>
                      <th className="px-4 py-2.5">Out</th>
                      <th className="px-4 py-2.5">Worked</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {attendance.slice(0, 31).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{a.date}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{a.clockIn || '-'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{a.clockOut || '-'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-700 font-bold">{fmtHM(a.workingMinutes)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : a.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-200' : a.status === 'On Leave' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === 'leaves' ? (
            leaves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No leave requests</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaves.map((l) => (
                  <div key={l.id} className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">{l.leaveType}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{l.startDate} → {l.endDate} · {l.totalDays} day{l.totalDays === 1 ? '' : 's'}</div>
                      {l.reason && <div className="text-[11px] text-slate-400 truncate mt-0.5">"{l.reason}"</div>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusChip(l.status)}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No tickets</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold font-mono text-indigo-600">{t.ticketCode}</span>
                        <span className="text-xs font-bold text-slate-800 truncate">{t.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{t.ticketType} · {t.priority} · {fmtDate(t.createdAt)}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusChip(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200/70 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {email}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
