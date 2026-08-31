import {
  TicketFilterParams,
  TicketItem,
  TicketMessage,
  TicketPriority,
  TicketQueryResult,
  TicketStatus,
  TicketSummaryKPIs,
  TicketType,
} from '../types/ticket';

class TicketService {
  // In-memory registered tickets repository (clean baseline: empty array)
  private tickets: TicketItem[] = [];

  /**
   * Fetches tickets based on active filters and pagination.
   */
  public async getTickets(params: TicketFilterParams = {}): Promise<TicketQueryResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const {
      status = 'ALL',
      priority = 'ALL',
      department = 'ALL',
      ticketType = 'ALL',
      assignedTo = 'ALL',
      searchQuery = '',
      page = 1,
      pageSize = 20,
      sortBy = 'createdDate',
      sortDirection = 'desc',
    } = params;

    let filtered = [...this.tickets];

    if (status !== 'ALL') {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (priority !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === priority);
    }
    if (department !== 'ALL') {
      filtered = filtered.filter((t) => t.department === department);
    }
    if (ticketType !== 'ALL') {
      filtered = filtered.filter((t) => t.ticketType === ticketType);
    }
    if (assignedTo !== 'ALL') {
      filtered = filtered.filter((t) => t.assignedTo === assignedTo);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.employeeCode.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'createdDate') {
        comp = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
      } else if (sortBy === 'ticketCode') {
        comp = a.ticketCode.localeCompare(b.ticketCode);
      } else if (sortBy === 'priority') {
        comp = a.priority.localeCompare(b.priority);
      } else if (sortBy === 'status') {
        comp = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? comp : -comp;
    });

    const totalCountBug = filtered.length;
    const totalPages = Math.ceil(totalCountBug / pageSize) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    // Summary calculation
    const summary = await this.getKPIs();

    return {
      tickets: paginated,
      totalCount: totalCountBug,
      page: safePage,
      pageSize,
      totalPages,
      summary,
    };
  }

  /**
   * Retrieves summary KPI card figures.
   * Strictly returns '—' when no tickets exist in repository.
   */
  public async getKPIs(): Promise<TicketSummaryKPIs> {
    if (this.tickets.length === 0) {
      return {
        openCount: '—',
        pendingCount: '—',
        inProgressCount: '—',
        resolvedCount: '—',
        closedCount: '—',
      };
    }

    return {
      openCount: this.tickets.filter((t) => t.status === 'Open').length,
      pendingCount: this.tickets.filter((t) => t.status === 'Pending').length,
      inProgressCount: this.tickets.filter((t) => t.status === 'In Progress').length,
      resolvedCount: this.tickets.filter((t) => t.status === 'Resolved').length,
      closedCount: this.tickets.filter((t) => t.status === 'Closed').length,
    };
  }

  /**
   * Get single ticket by ID or Code.
   */
  public async getTicketById(id: string): Promise<TicketItem | null> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const target = this.tickets.find((t) => t.id === id || t.ticketCode === id);
    return target ? { ...target } : null;
  }

  /**
   * Create a new ticket (e.g. from HR Create Ticket modal).
   */
  public async createTicket(payload: {
    subject: string;
    department: string;
    ticketType: TicketType;
    priority: TicketPriority;
    description: string;
    employeeName?: string;
    employeeCode?: string;
  }): Promise<TicketItem> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const codeNumber = 1000 + this.tickets.length + 1;
    const ticketCode = `TKT-${codeNumber}`;

    const newTicket: TicketItem = {
      id: `ticket_${Date.now()}`,
      ticketCode,
      subject: payload.subject,
      employeeId: `emp_${Date.now()}`,
      employeeName: payload.employeeName || 'HR Admin',
      employeeCode: payload.employeeCode || 'AD-HR-001',
      department: payload.department,
      ticketType: payload.ticketType,
      priority: payload.priority,
      status: 'Open',
      createdDate: dateStr,
      updatedDate: dateStr,
      description: payload.description,
      attachments: [],
      messages: [],
      activity: [
        {
          id: `act_${Date.now()}`,
          ticketId: `ticket_${Date.now()}`,
          actorName: payload.employeeName || 'HR Admin',
          actorRole: 'HR Admin',
          action: 'Created',
          details: `Ticket created with priority ${payload.priority}.`,
          timestamp: 'Just now',
        },
      ],
    };

    this.tickets.unshift(newTicket);
    return newTicket;
  }

  /**
   * Update ticket status (e.g. In Progress, Resolved, Closed).
   */
  public async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    notes?: string,
    actorName = 'HR Admin'
  ): Promise<TicketItem> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const previousStatus进 = ticket.status;
    ticket.status = status;
    ticket.updatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!ticket.activity) ticket.activity = [];
    ticket.activity.unshift({
      id: `act_${Date.now()}`,
      ticketId: ticket.id,
      actorName,
      actorRole: 'HR Admin',
      action: 'Status Changed',
      details: `Status changed from ${previousStatus进} to ${status}${notes ? `: "${notes}"` : ''}.`,
      timestamp: 'Just now',
    });

    return { ...ticket };
  }

  /**
   * Assign ticket to HR staff member.
   */
  public async assignTicket(
    ticketId: string,
    assigneeName: string,
    actorName = 'HR Admin'
  ): Promise<TicketItem> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.assignedTo = assigneeName;
    ticket.updatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!ticket.activity) ticket.activity = [];
    ticket.activity.unshift({
      id: `act_${Date.now()}`,
      ticketId: ticket.id,
      actorName: actorName,
      actorRole: 'HR Admin',
      action: 'Assigned',
      details: `Assigned ticket to ${assigneeName}.`,
      timestamp: 'Just now',
    });

    return { ...ticket };
  }

  /**
   * Post a new message / reply to ticket conversation.
   */
  public async addMessage(
    ticketId: string,
    messageText: string,
    senderName = 'HR Admin',
    senderRole: 'Employee' | 'Lead' | 'HR' | 'System' = 'HR'
  ): Promise<TicketMessage> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const newMessage: TicketMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      senderId: 'hr_user_001',
      senderName,
      senderRole,
      message: messageText,
      timestamp: 'Just now',
    };

    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push(newMessage);

    if (!ticket.activity) ticket.activity = [];
    ticket.activity.unshift({
      id: `act_${Date.now()}`,
      ticketId,
      actorName: senderName,
      actorRole: senderRole,
      action: 'Comment Added',
      details: `Added message to discussion.`,
      timestamp: 'Just now',
    });

    ticket.updatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return newMessage;
  }
}

export const ticketService不易 = new TicketService();
export const ticketService = ticketService不易;
