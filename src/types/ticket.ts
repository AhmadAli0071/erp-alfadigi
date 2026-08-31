export type TicketStatus = 'Open' | 'Pending' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TicketType =
  | 'General HR'
  | 'Attendance Correction'
  | 'Leave Inquiry'
  | 'Payroll & Salary'
  | 'Hardware / IT'
  | 'Workplace / Facility'
  | 'Policy & Grievance'
  | 'Other';

export interface TicketAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Employee' | 'Lead' | 'HR' | 'System';
  message: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorName: string;
  actorRole: string;
  action: 'Created' | 'Assigned' | 'Status Changed' | 'Comment Added' | 'Resolved' | 'Closed' | 'Priority Changed';
  details: string;
  timestamp: string;
}

export interface TicketItem {
  id: string;
  ticketCode: string;
  subject: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  ticketType: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  createdDate: string;
  updatedDate: string;
  description: string;
  attachments?: TicketAttachment[];
  messages?: TicketMessage[];
  activity?: TicketActivity[];
}

export interface TicketFilterParams {
  status?: string; // 'ALL' | TicketStatus
  priority?: string; // 'ALL' | TicketPriority
  department?: string; // 'ALL' | DepartmentName
  ticketType?: string; // 'ALL' | TicketType
  assignedTo?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TicketSummaryKPIs {
  openCount: number | '—';
  pendingCount: number | '—';
  inProgressCount: number | '—';
  resolvedCount: number | '—';
  closedCount: number | '—';
}

export interface TicketQueryResult {
  tickets: TicketItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: TicketSummaryKPIs;
}
