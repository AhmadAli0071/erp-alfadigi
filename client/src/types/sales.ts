export interface Sale {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  clientName: string;
  description: string;
  saleDate: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
}

export interface CommissionSummary {
  eligible: boolean;
  month: string;
  role?: string;
  totalSales: number;
  target: number;
  unlocked: boolean;
  extraAmount: number;
  commission: number;
  rate: number;
  salesCount?: number;
}

export interface CommissionRow {
  employeeId: string;
  name: string;
  email: string;
  jobTitle: string;
  role: string;
  salesCount: number;
  totalSales: number;
  target: number;
  unlocked: boolean;
  extraAmount: number;
  commission: number;
  rate: number;
}

export interface SaleRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  clientAddress?: string;
  saleDate: string;
  description?: string;
  requestedByName: string;
  requestedByEmail: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewedByRole?: string;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface EarningsRow {
  employeeId: string;
  name: string;
  email: string;
  jobTitle: string;
  totalSales: number;
  salesCount: number;
}

export const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const fmtUSD = (n: number): string =>
  `Rs ${n.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
