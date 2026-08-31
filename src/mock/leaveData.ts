import {
  EmployeeLeaveBalance,
  LeaveRequest,
  LeaveTypePolicy,
} from '../types/leave';
import { MOCK_EMPLOYEES } from './hrData';

export const MOCK_LEAVE_TYPES: LeaveTypePolicy[] = [
  {
    id: 'lt_casual',
    name: 'Casual Leave',
    code: 'CL',
    annualQuota: 12,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Short notice leave for urgent personal errands and brief unplanned leaves.',
    colorBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'lt_annual',
    name: 'Annual Leave',
    code: 'AL',
    annualQuota: 18,
    carryForwardLimit: 5,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Scheduled vacation and planned personal leaves. Minimum 3 days prior notice required.',
    colorBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'lt_sick',
    name: 'Sick Leave',
    code: 'SL',
    annualQuota: 10,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: true,
    description: 'Medical emergencies or certified illnesses. Medical slip required if > 2 days.',
    colorBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'lt_unpaid',
    name: 'Unpaid Leave',
    code: 'UL',
    annualQuota: 30,
    carryForwardLimit: 0,
    isPaid: false,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Leave without pay availed when all paid leave balances have been exhausted.',
    colorBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    id: 'lt_bereavement',
    name: 'Bereavement Leave',
    code: 'BL',
    annualQuota: 5,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Compassionate leave granted in the event of the loss of an immediate family member.',
    colorBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'lt_special',
    name: 'Special / Other Leave',
    code: 'SP',
    annualQuota: 5,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: true,
    description: 'Hajj, wedding, or extraordinary executive-granted leaves.',
    colorBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
];

export const MOCK_LEAVE_BALANCES: Record<string, EmployeeLeaveBalance> = {};

// Generate default balance for any employee if requested
export function getOrCreateEmployeeBalance(empId: string): EmployeeLeaveBalance {
  if (MOCK_LEAVE_BALANCES[empId]) return MOCK_LEAVE_BALANCES[empId];
  const emp = MOCK_EMPLOYEES.find((e) => e.id === empId);
  const name = emp ? emp.name : 'Employee';
  const code = emp ? emp.empId : 'AD-000';
  const dept = emp ? emp.department : 'HR';
  const desig = emp ? emp.jobTitle : 'Associate';

  const defaultBalance: EmployeeLeaveBalance = {
    employeeId: empId,
    employeeName: name,
    employeeCode: code,
    department: dept,
    designation: desig,
    year: new Date().getFullYear(),
    categories: {
      casual: { leaveType: 'Casual Leave', allocated: 12, available: 12, used: 0, pending: 0, color: 'text-indigo-400' },
      annual: { leaveType: 'Annual Leave', allocated: 18, available: 18, used: 0, pending: 0, color: 'text-emerald-400' },
      sick: { leaveType: 'Sick Leave', allocated: 10, available: 10, used: 0, pending: 0, color: 'text-amber-400' },
      unpaid: { leaveType: 'Unpaid Leave', allocated: 0, available: 0, used: 0, pending: 0, color: 'text-rose-400' },
      other: { leaveType: 'Special / Other Leave', allocated: 5, available: 5, used: 0, pending: 0, color: 'text-purple-400' },
    },
  };
  MOCK_LEAVE_BALANCES[empId] = defaultBalance;
  return defaultBalance;
}

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];
