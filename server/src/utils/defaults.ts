import { LeaveType } from '../models/LeaveType.js';
import { SystemSetting } from '../models/SystemSetting.js';

/* ------------------------------------------------------------------ */
/* SYSTEM SETTINGS DEFAULTS                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS = {
  general: {
    companyName: 'Alfa Digi ERP',
    systemName: 'Alfa Digi ERP',
    timezone: 'Asia/Karachi (UTC+05:00)',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12-Hour (06:00 PM)',
  },
  attendance: {
    shiftStart: '06:00 PM',
    shiftEnd: '03:00 AM',
    requiredWorkingHours: 8,
    gracePeriodMinutes: 10,
    breakDeductionEnabled: true,
    unlimitedBreakDurationEnabled: true,
    breakTypeBudgets: {
      lunch: 60,
      namaz: 10,
      washroom: 10,
    },
  },
  overtime: {
    overtimeBeforeShiftEnabled: true,
    overtimeAfterShiftEnabled: true,
    hrVerificationRequired: true,
    automaticOvertimeTicket: true,
    minimumOvertimeMinutes: 15,
  },
  leave: {
    leaveYearType: 'Calendar Year',
    leaveYearStartMonth: 'January 1',
    leaveYearEndMonth: 'December 31',
  },
  notifications: {
    leaveRequestNotifications: true,
    attendanceCorrectionNotifications: true,
    overtimeVerificationNotifications: true,
    ticketNotifications: true,
    approvalNotifications: true,
    emailNotifications: true,
    inAppNotifications: true,
  },
  workflow: {
    steps: [
      {
        stepNumber: 1,
        roleTitle: 'Employee',
        description: 'Submits request or logs inquiry with required details',
        isMandatory: true,
      },
      {
        stepNumber: 2,
        roleTitle: 'Department Lead',
        description: 'Reviews shift roster, verifies validity & endorses request',
        isMandatory: true,
      },
      {
        stepNumber: 3,
        roleTitle: 'HR Admin',
        description: 'Validates company policy, quota balance & executes approval',
        isMandatory: true,
      },
      {
        stepNumber: 4,
        roleTitle: 'Final Approval',
        description: 'System automatically updates payroll, logs and rosters',
        isMandatory: true,
      },
    ],
    autoEscalateDays: 2,
    allowSelfApproval: false,
  },
  security: {
    sessionTimeoutMinutes: 60,
    requireTwoFactorAuth: false,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
};

/* ------------------------------------------------------------------ */
/* LEAVE TYPE DEFAULTS                                                 */
/* ------------------------------------------------------------------ */

export const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Casual Leave',
    code: 'CL',
    annualQuota: 12,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Short notice leave for urgent personal errands and brief unplanned leaves.',
    colorBadge: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30',
    order: 1,
  },
  {
    name: 'Annual Leave',
    code: 'AL',
    annualQuota: 18,
    carryForwardLimit: 5,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Scheduled vacation and planned personal leaves. Minimum 3 days prior notice required.',
    colorBadge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    order: 2,
  },
  {
    name: 'Sick Leave',
    code: 'SL',
    annualQuota: 10,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: true,
    description: 'Medical emergencies or certified illnesses. Medical slip required if > 2 days.',
    colorBadge: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    order: 3,
  },
  {
    name: 'Unpaid Leave',
    code: 'UL',
    annualQuota: 30,
    carryForwardLimit: 0,
    isPaid: false,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Leave without pay availed when all paid leave balances have been exhausted.',
    colorBadge: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    order: 4,
  },
  {
    name: 'Maternity / Paternity',
    code: 'MP',
    annualQuota: 90,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: true,
    description: 'Maternity or paternity leave for the birth or adoption of a child. Documentation required.',
    colorBadge: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    order: 5,
  },
  {
    name: 'Bereavement Leave',
    code: 'BL',
    annualQuota: 5,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: false,
    description: 'Compassionate leave granted in the event of the loss of an immediate family member.',
    colorBadge: 'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30',
    order: 6,
  },
  {
    name: 'Special / Other Leave',
    code: 'SP',
    annualQuota: 5,
    carryForwardLimit: 0,
    isPaid: true,
    requiresLeadApproval: true,
    requiresDocument: true,
    description: 'Hajj, wedding, or extraordinary executive-granted leaves.',
    colorBadge: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
    order: 7,
  },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...target };
  for (const [key, val] of Object.entries(source)) {
    if (isPlainObject(val) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key] as Record<string, unknown>, val);
    } else {
      out[key] = val;
    }
  }
  return out;
};

/** Inserts the default leave types if the collection is empty (self-healing). */
export const ensureLeaveTypes = async (): Promise<void> => {
  const count = await LeaveType.estimatedDocumentCount();
  if (count === 0) {
    await LeaveType.insertMany(DEFAULT_LEAVE_TYPES);
    console.log('✅ Default leave types created');
  }
};

/** Creates the global settings document if missing (self-healing).
 *  Fills any keys missing from older saved settings with current defaults. */
export const ensureSettings = async (): Promise<Record<string, unknown>> => {
  const existing = await SystemSetting.findOne({ key: 'global' });
  if (existing) {
    return deepMerge(
      DEFAULT_SETTINGS as unknown as Record<string, unknown>,
      existing.value as Record<string, unknown>,
    );
  }
  const created = await SystemSetting.create({ key: 'global', value: DEFAULT_SETTINGS });
  console.log('⚙️ Default system settings created');
  return created.value;
};
