import {
  AuthResponse,
  DemoUserAccount,
  LoginCredentials,
  ResetPasswordResponse,
  User,
  UserRole,
} from '../types/auth';

// ---- API config ----
const API_BASE = '/api';

// ---- Demo accounts (kept for login hint UI only) ----
export const DEMO_PASSWORD = 'Admin@123';

export const DEMO_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'usr_001',
    name: 'Super Admin',
    email: 'admin@alfadigi.local',
    role: 'SUPER_ADMIN',
    jobTitle: 'Global System Administrator',
    roleDisplayName: 'Super Admin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
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
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
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
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
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
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    demoPasswordHint: DEMO_PASSWORD,
  },
];

// ---- Types ----
export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
  requestPasswordReset(email: string): Promise<ResetPasswordResponse>;
  getDemoAccounts(): DemoUserAccount[];
  createUserAccount(input: CreateUserAccountInput): Promise<CreateUserAccountResult>;
  getCreatedAccounts(): Promise<StoredUserAccount[]>;
}

export interface CreateUserAccountInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  jobTitle: string;
  reportedTo?: string;
}

export interface StoredUserAccount extends User {
  password?: string;
  createdAt: string;
}

export interface CreateUserAccountResult {
  success: boolean;
  error?: string;
  account?: StoredUserAccount;
}

// ---- Storage keys ----
const SESSION_KEY = 'alfa_digi_erp_user_session';
const TOKEN_KEY = 'alfa_digi_erp_token';
const REMEMBERED_EMAIL_KEY = 'alfa_digi_erp_remembered_email';

// ---- Token helper ----
const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---- Service ----
class AuthService implements IAuthService {
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
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      const authenticatedUser: User = data.user;

      this.currentUser = authenticatedUser;

      try {
        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        storage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
        storage.setItem(TOKEN_KEY, data.token);
        if (credentials.rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          sessionStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Storage access resilience
      }

      return { success: true, user: authenticatedUser };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to server. Please try again.',
      };
    }
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
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
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: input.name.trim(),
          email: input.email.trim(),
          password: input.password,
          role: input.role,
          department: input.department,
          jobTitle: input.jobTitle.trim(),
          reportedTo: input.reportedTo || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Unable to create account.' };
      }

      return { success: true, account: data.account };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to server. Please try again.',
      };
    }
  }

  public async getCreatedAccounts(): Promise<StoredUserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/accounts`, {
        headers: authHeaders(),
      });

      if (!res.ok) return [];

      const data = await res.json();
      return data.accounts || [];
    } catch {
      return [];
    }
  }
}

// Singleton instance export
export const authService: IAuthService & {
  getRememberedEmail: () => string;
  getCreatedAccounts: () => Promise<StoredUserAccount[]>;
} = new AuthService();
