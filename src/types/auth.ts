export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'DEPARTMENT_LEAD' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  jobTitle: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface DemoUserAccount extends User {
  demoPasswordHint: string;
  roleDisplayName: string;
  badgeColor: string;
}
