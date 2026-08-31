import React, { useState, useEffect, useCallback } from 'react';
import {
  TicketFilterParams,
  TicketItem,
  TicketQueryResult,
  TicketStatus,
  TicketSummaryKPIs,
} from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { HRTicketSummaryCards } from './HRTicketSummaryCards';
import { HRTicketFilterBar } from './HRTicketFilterBar';
import { HRTicketTable } from './HRTicketTable';
import { HRTicketDetailDrawer } from './HRTicketDetailDrawer';
import { HRCreateTicketModal } from './HRCreateTicketModal';
import {
  Ticket,
  Plus,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface HRTicketManagementViewProps {
  onNavigateToDashboard?: () => void;
}

export const HRTicketManagementView: React.FC<HRTicketManagementViewProps> = ({
  onNavigateToDashboard,
}) => {
  const [filters, setFilters] = useState<TicketFilterParams>({
    status: 'ALL',
    priority: 'ALL',
    department: 'ALL',
    ticketType: 'ALL',
    datePreset: 'all',
    searchQuery: '',
    page: 1,
    pageSize: 20,
    sortBy: 'createdDate',
    sortDirection: 'desc',
  });

  const [ticketData, setTicketData] = useState<TicketQueryResult>({
    tickets: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    summary: {
      openCount: '—',
      pendingCount: '—',
      inProgressCount: '—',
      resolvedCount: '—',
      closedCount: '—',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ticketService.getTickets(filters);
      setTicketData(res);
      // Update active selected ticket if open
      if (selectedTicket) {
        const updated = res.tickets.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const handleFilterChange = (newFilters: Partial<TicketFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      priority: 'ALL',
      department: 'ALL',
      ticketType: 'ALL',
      datePreset: 'all',
      searchQuery: '',
      page: 1,
      pageSize: 20,
      sortBy: 'createdDate',
      sortDirection: 'desc',
    });
  };

  const handleCreateTicketSubmit = async (payload: any) => {
    await ticketService.createTicket(payload);
    showToast('Ticket created successfully.');
    fetchTickets();
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus, notes?: string) => {
    await ticketService.updateTicketStatus(ticketId, status, notes);
    showToast(`Ticket status updated to ${status}.`);
    fetchTickets();
  };

  const handleAssignTicket = async (ticketId: string, assignee: string) => {
    await ticketService.assignTicket(ticketId, assignee);
    showToast(`Ticket assigned to ${assignee}.`);
    fetchTickets();
  };

  const handleSendMessage = async (ticketId: string, text: string) => {
    await ticketService.addMessage(ticketId, text);
    showToast('Message sent.');
    fetchTickets();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="hr-ticket-management-screen">
      {/* Toast notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 md:hidden"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-indigo-400" />
              Ticket Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage employee requests, issues and HR support tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition-colors disabled:opacity-40"
            title="Refresh tickets"
            id="ticket-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            id="create-ticket-header-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <HRTicketSummaryCards summary={ticketData.summary} isLoading={isLoading} />

      {/* Filters Bar */}
      <HRTicketFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalFilteredCount={ticketData.totalCount}
      />

      {/* Tickets Table / List */}
      <HRTicketTable
        tickets={ticketData.tickets}
        isLoading={isLoading}
        page={ticketData.page}
        pageSize={ticketData.pageSize}
        totalCount={ticketData.totalCount}
        totalPages={ticketData.totalPages}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onPageSizeChange={(s) => handleFilterChange({ pageSize: s, page: 1 })}
        onSelectTicket={(ticket) => {
          setSelectedTicket(ticket);
          setIsDetailDrawerOpen(true);
        }}
        onActionClick={(ticket, act) => {
          setSelectedTicket(ticket);
          setIsDetailDrawerOpen(true);
        }}
      />

      {/* Ticket Detail Drawer */}
      <HRTicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedTicket(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onAssignTicket={handleAssignTicket}
        onSendMessage={handleSendMessage}
      />

      {/* Create Ticket Modal */}
      <HRCreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicketSubmit}
      />
    </div>
  );
};
