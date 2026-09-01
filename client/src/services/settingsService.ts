import { HRSystemSettings } from '../types/settings';

const DEFAULT_SETTINGS: HRSystemSettings = {
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
    gracePeriodMinutes: 5,
    breakDeductionEnabled: true,
    unlimitedBreakDurationEnabled: true,
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
    leaveTypes: [
      {
        id: 'cl',
        name: 'Casual Leave',
        code: 'CL',
        annualQuota: 12,
        isPaid: true,
        requiresDocument: false,
      },
      {
        id: 'sl',
        name: 'Sick Leave',
        code: 'SL',
        annualQuota: 10,
        isPaid: true,
        requiresDocument: true,
      },
      {
        id: 'al',
        name: 'Annual Leave',
        code: 'AL',
        annualQuota: 18,
        isPaid: true,
        requiresDocument: false,
      },
      {
        id: 'ul',
        name: 'Unpaid Leave',
        code: 'UL',
        annualQuota: 30,
        isPaid: false,
        requiresDocument: false,
      },
      {
        id: 'sp',
        name: 'Special / Other Leave',
        code: 'SP',
        annualQuota: 5,
        isPaid: true,
        requiresDocument: true,
      },
    ],
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

class SettingsService {
  private currentSettings: HRSystemSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  /**
   * Retrieves active ERP settings.
   */
  public async getSettings(): Promise<HRSystemSettings> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return JSON.parse(JSON.stringify(this.currentSettings));
  }

  /**
   * Saves updated settings (Frontend state confirmation).
   */
  public async saveSettings(newSettings: HRSystemSettings): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    this.currentSettings = JSON.parse(JSON.stringify(newSettings));
    return {
      success: true,
      message: 'Settings saved successfully.',
    };
  }

  /**
   * Resets settings back to system defaults.
   */
  public async resetToDefaults(): Promise<HRSystemSettings> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    return JSON.parse(JSON.stringify(this.currentSettings));
  }
}

export const settingsService = new SettingsService();
