const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

export interface LeaveTypePolicy {
  id: string;
  name: string;
  code: string;
  annualQuota: number;
  carryForwardLimit: number;
  isPaid: boolean;
  requiresLeadApproval: boolean;
  requiresDocument: boolean;
  description: string;
  colorBadge: string;
  order: number;
  isActive: boolean;
}

export interface LeaveTypeInput {
  name: string;
  code: string;
  annualQuota: number;
  carryForwardLimit?: number;
  isPaid?: boolean;
  requiresLeadApproval?: boolean;
  requiresDocument?: boolean;
  description?: string;
  colorBadge?: string;
  isActive?: boolean;
}

class LeaveTypeService {
  public async getLeaveTypes(includeInactive = false): Promise<LeaveTypePolicy[]> {
    const res = await fetch(`${API_BASE}/leave-types${includeInactive ? '?includeInactive=1' : ''}`, {
      headers: getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to load leave types.');
    return data.types || [];
  }

  public async createLeaveType(input: LeaveTypeInput): Promise<LeaveTypePolicy> {
    const res = await fetch(`${API_BASE}/leave-types`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to create leave type.');
    return data.type;
  }

  public async updateLeaveType(id: string, patch: Partial<LeaveTypeInput>): Promise<LeaveTypePolicy> {
    const res = await fetch(`${API_BASE}/leave-types/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to update leave type.');
    return data.type;
  }

  public async deactivateLeaveType(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/leave-types/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Unable to deactivate leave type.');
  }
}

export const leaveTypeService = new LeaveTypeService();
