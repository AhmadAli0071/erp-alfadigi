export interface GeneralSettings {
  companyName: string;
  systemName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export interface AttendanceSettings {
  shiftStart: string; // e.g. "06:00 PM"
  shiftEnd: string; // e.g. "03:00 AM"
  requiredWorkingHours: number; // e.g. 8
  gracePeriodMinutes: number; // e.g. 5
  breakDeductionEnabled: boolean;
  unlimitedBreakDurationEnabled: boolean;
}

export interface OvertimeSettings {
  overtimeBeforeShiftEnabled: boolean;
  overtimeAfterShiftEnabled: boolean;
  hrVerificationRequired: boolean;
  automaticOvertimeTicket: boolean;
  minimumOvertimeMinutes: number;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  annualQuota: number;
  isPaid: boolean;
  requiresDocument: boolean;
}

export interface LeaveSettings {
  leaveYearType: 'Calendar Year' | 'Fiscal Year';
  leaveYearStartMonth: string;
  leaveYearEndMonth: string;
  leaveTypes: LeaveTypeConfig[];
}

export interface NotificationSettings {
  leaveRequestNotifications: boolean;
  attendanceCorrectionNotifications: boolean;
  overtimeVerificationNotifications: boolean;
  ticketNotifications: boolean;
  approvalNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export interface ApprovalWorkflowStep {
  stepNumber: number;
  roleTitle: string;
  description: string;
  isMandatory: boolean;
}

export interface ApprovalWorkflowSettings {
  steps: ApprovalWorkflowStep[];
  autoEscalateDays: number;
  allowSelfApproval: boolean;
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  requireTwoFactorAuth: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface HRSystemSettings {
  general: GeneralSettings;
  attendance: AttendanceSettings;
  overtime: OvertimeSettings;
  leave: LeaveSettings;
  notifications: NotificationSettings;
  workflow: ApprovalWorkflowSettings;
  security: SecuritySettings;
}
