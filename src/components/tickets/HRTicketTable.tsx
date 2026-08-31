import React from 'react';
import { TicketItem, TicketPriority, TicketStatus } from '../../types/ticket';
import {
  Ticket,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface HRTicketTableProps {
  tickets: TicketItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSelectTicket: (ticket: TicketItem) => void;
  onActionClick: (ticket: TicketItem, action: 'status' | 'assign') => void;
}

export const HRTicketTable: React.FC<HRTicketTableProps> = ({
  tickets,
  isLoading,
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSelectTicket,
  onActionClick,
}) => {
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Open
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            Closed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Flame className="w-3 h-3 text-rose-400" />
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/20">
            Low
          </span>
        );
    }
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-[#0f1015] border border-white/5 rounded-2xl overflow-hidden shadow-xl" id="hr-ticket-table-container">
      {/* Loading Overlay */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-semibold text-slate-200">No tickets found</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tickets will appear here when employees or leads create them.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse" id="hr-ticket-data-table">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => onSelectTicket(t)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {t.ticketCode}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.ticketType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{t.employeeName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{t.employeeCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{t.department}</td>
                    <td className="py-3.5 px-4">{getPriorityBadge(t.priority)}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {t.assignedTo ? (
                        <span className="text-slate-200">{t.assignedTo}</span>
                      ) : (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{t.createdDate}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTicket(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-white/5">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="p-4 space-y-3 hover:bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-400">
                    {t.ticketCode}
                  </span>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{t.subject}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t.ticketType}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-slate-300 font-medium">{t.employeeName}</span> ({t.department})
                  </div>
                  <div className="text-[11px] text-slate-500">{t.createdDate}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[#14151e] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            id="ticket-page-size-select"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span>
            Showing <strong className="text-white">{startRecord}</strong> to{' '}
            <strong className="text-white">{endRecord}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> tickets
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            title="Previous Page"
            id="ticket-prev-page-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-mono text-xs text-slate-300 bg-white/5 rounded-lg border border-white/5">
            Page {totalPages > 0 ? page : 0} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || isLoading || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            title="Next Page"
            id="ticket-next-page-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
