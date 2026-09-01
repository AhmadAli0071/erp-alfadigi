import {
  AuthResponse,
  DemoUserAccount,
  LoginCredentials,
  ResetPasswordResponse,
  User,
  UserRole,
} from '../types/auth';

// FRONTEND DEMO AUTH ONLY — Used exclusively for UI navigation and testing.
// These are not real employee records and are not referenced by business data.
export const DEMO_PASSWORD = 'Admin@123';

export const DEMO_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'usr_001',
    name: 'Super Admin',
    email: 'admin@alfadigi.local',
    role: 'SUPER_ADMIN',
    jobTitle: 'Global System Administrator',
    roleDisplayName: 'Super Admin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    demoPasswordHint: DEMO_PASSWORD,
  },
  {
    id: 'usr_002',
    name: 'HR Admin',
    email: 'hr@alfadigi.local',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    jobTitle: 'Head of People & Culture',
    roleDisplayName: 'HR Admin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    demoPasswordHint: DEMO_PASSWORD,
  },
  {
    id: 'usr_003',
    name: 'Sales Lead',
    email: 'saleslead@alfadigi.local',
    role: 'DEPARTMENT_LEAD',
    department: 'Sales',
    jobTitle: 'Director of Enterprise Sales',
    roleDisplayName: 'Sales Lead',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    demoPasswordHint: DEMO_PASSWORD,
  },
  {
    id: 'usr_004',
    name: 'Tech Lead',
    email: 'techlead@alfadigi.local',
    role: 'DEPARTMENT_LEAD',
    department: 'Tech',
    jobTitle: 'Principal Engineering Lead',
    roleDisplayName: 'Tech Lead',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    demoPasswordHint: DEMO_PASSWORD,
  },
  {
    id: 'usr_005',
    name: 'Sales Associate',
    email: 'employee@alfadigi.local',
    role: 'EMPLOYEE',
    department: 'Sales',
    jobTitle: 'Account Executive',
    roleDisplayName: 'Employee',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    demoPasswordHint: DEMO_PASSWORD,
  },
];

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
  requestPasswordReset(email: string): Promise<ResetPasswordResponse>;
  getDemoAccounts(): DemoUserAccount[];
  createUserAccount(input: CreateUserAccountInput): Promise<CreateUserAccountResult>;
  getCreatedAccounts(): StoredUserAccount[];
}

// ---- HR-created user accounts (persisted locally until backend exists) ----

export interface CreateUserAccountInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  jobTitle: string;
}

export interface StoredUserAccount extends User {
  password: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateUserAccountResult {
  success: boolean;
  error?: string;
  account?: StoredUserAccount;
}

const CREATED_ACCOUNTS_KEY = 'alfa_digi_erp_created_accounts';

const readCreatedAccounts = (): StoredUserAccount[] => {
  try {
    const stored = localStorage.getItem(CREATED_ACCOUNTS_KEY);
    return stored ? (JSON.parse(stored) as StoredUserAccount[]) : [];
  } catch {
    return [];
  }
};

const writeCreatedAccounts = (accounts: StoredUserAccount[]) => {
  try {
    localStorage.setItem(CREATED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage access resilience
  }
};

const SESSION_KEY = 'alfa_digi_erp_user_session';
const REMEMBERED_EMAIL_KEY = 'alfa_digi_erp_remembered_email';

class MockAuthService implements IAuthService {
  private currentUser: User | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate natural enterprise network latency (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = credentials.email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === normalizedEmail
    );
    const createdAccount = readCreatedAccounts().find(
      (acc) => acc.email.toLowerCase() === normalizedEmail
    );

    // Validation check: generic error to avoid exposing email presence
    const passwordMatches = account
      ? credentials.password === DEMO_PASSWORD
      : createdAccount
        ? credentials.password === createdAccount.password
        : false;

    if ((!account && !createdAccount) || !passwordMatches) {
      return {
        success: false,
        error: 'Invalid email or password. Please try again.',
      };
    }

    const source: Omit<StoredUserAccount, 'password' | 'createdAt' | 'createdBy'> = account
      ? {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          department: account.department,
          jobTitle: account.jobTitle,
        }
      : {
          id: createdAccount!.id,
          name: createdAccount!.name,
          email: createdAccount!.email,
          role: createdAccount!.role,
          department: createdAccount!.department,
          jobTitle: createdAccount!.jobTitle,
        };

    const authenticatedUser: User = source;

    this.currentUser = authenticatedUser;

    try {
      if (credentials.rememberMe) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
        localStorage.setItem(REMEMBERED_EMAIL_KEY, account.email);
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Storage access resilience
    }

    return {
      success: true,
      user: authenticatedUser,
    };
  }

  public async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.currentUser = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  public getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    try {
      const stored =
        localStorage.getItem(SESSION_KEY) ||
        sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public getRememberedEmail(): string {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  }

  public async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      message:
        'If this were connected to the backend, a password reset link would be sent to your email.',
    };
  }

  public getDemoAccounts(): DemoUserAccount[] {
    return DEMO_ACCOUNTS;
  }

  public async createUserAccount(
    input: CreateUserAccountInput
  ): Promise<CreateUserAccountResult> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const jobTitle = input.jobTitle.trim();
    const department = input.department?.trim();

    if (!name || !normalizedEmail || !input.password || !jobTitle) {
      return { success: false, error: 'All required fields must be filled.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (input.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    const emailTaken =
      DEMO_ACCOUNTS.some((acc) => acc.email.toLowerCase() === normalizedEmail) ||
      readCreatedAccounts().some((acc) => acc.email.toLowerCase() === normalizedEmail);

    if (emailTaken) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const account: StoredUserAccount = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      email: normalizedEmail,
      password: input.password,
      role: input.role,
      department,
      jobTitle,
      createdAt: new Date().toISOString(),
      createdBy: 'HR Admin',
    };

    const accounts = readCreatedAccounts();
    accounts.push(account);
    writeCreatedAccounts(accounts);

    return { success: true, account };
  }

  public getCreatedAccounts(): StoredUserAccount[] {
    return readCreatedAccounts();
  }
}

// Singleton instance export
export const authService: IAuthService & {
  getRememberedEmail: () => string;
  getCreatedAccounts: () => StoredUserAccount[];
} = new MockAuthService();
