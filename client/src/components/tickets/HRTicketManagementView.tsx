import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../hr/StatusBadge';
import {
  Ticket,
  ArrowLeft,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Send,
  MessageSquare,
} from 'lucide-react';

interface HRTicketManagementViewProps {
  onNavigateToDashboard?: () => void;
}

interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

interface TicketRecord {
  id: string;
  ticketCode: string;
  subject: string;
  description: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  ticketType: string;
  priority: string;
  status: string;
  messages: TicketMessage[];
  createdAt: string;
}

const API_BASE = '/api';

const getHeaders = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const STATUS_OPTIONS = ['ALL', 'Resolved', 'HR In Process', 'Closed', 'Rejected'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-indigo-100 text-indigo-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-rose-100 text-rose-700',
};

export const HRTicketManagementView: React.FC<HRTicketManagementViewProps> = ({
  onNavigateToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<TicketRecord | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/hr?status=${encodeURIComponent(selectedStatus)}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError('Unable to load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((t) =>
    !searchQuery ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    awaiting: tickets.filter((t) => t.status === 'Resolved').length,
    inProcess: tickets.filter((t) => t.status === 'HR In Process').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
    rejected: tickets.filter((t) => t.status === 'Rejected').length,
  };

  const performAction = async (ticketId: string, action: 'hr-approve' | 'hr-reject' | 'hr-inprocess') => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setDetailModal(null);
        fetchTickets();
      }
    } catch { /* ignore */ }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !detailModal) return;
    try {
      const token = localStorage.getItem('alfa_digi_erp_token') || sessionStorage.getItem('alfa_digi_erp_token');
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const me = meRes.ok ? await meRes.json() : null;
      const senderEmail = me?.user?.email;
      if (!senderEmail) return;

      const res = await fetch(`${API_BASE}/tickets/${detailModal.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ senderEmail, message: newMessage }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setDetailModal({
          ...detailModal,
          messages: [...detailModal.messages, data.message],
        });
        setNewMessage('');
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Ticket className="w-6 h-6 text-indigo-600" />
              Ticket Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">Lead-resolved tickets — final HR decision</p>
          </div>
        </div>
        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting HR', value: summary.awaiting, icon: <Clock className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'HR In Process', value: summary.inProcess, icon: <Loader2 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
          { label: 'Closed (Approved)', value: summary.closed, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
          { label: 'Rejected', value: summary.rejected, icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-500/[0.04] border-rose-200' },
        ].map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {card.icon}
              <span className="text-xs font-medium text-slate-700">{card.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'Awaiting HR Decision' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading tickets…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchTickets} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Try again</button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Ticket className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No tickets</p>
          <p className="text-xs text-slate-400">Tickets resolved by leads will appear here for final HR decision.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Ticket</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setDetailModal(ticket)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-indigo-600">{ticket.ticketCode}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{ticket.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{ticket.employeeCode} · {ticket.department}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{ticket.subject}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ticket.status as 'Resolved' | 'HR In Process' | 'Closed' | 'Rejected'} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      {ticket.status === 'Resolved' || ticket.status === 'HR In Process' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => performAction(ticket.id, 'hr-approve')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => performAction(ticket.id, 'hr-inprocess')}
                            disabled={ticket.status === 'HR In Process'}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                          >
                            In Process
                          </button>
                          <button
                            onClick={() => performAction(ticket.id, 'hr-reject')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => setDetailModal(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <Ticket className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailModal.ticketCode}</h3>
                  <p className="text-[11px] text-slate-500">{detailModal.subject}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={detailModal.status as 'Resolved' | 'HR In Process' | 'Closed' | 'Rejected'} size="xs" />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[detailModal.priority] || 'bg-slate-100 text-slate-600'}`}>
                {detailModal.priority}
              </span>
              <span className="text-[10px] text-slate-500 ml-auto">{detailModal.employeeName} · {detailModal.ticketType}</span>
            </div>

            {detailModal.description && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-3">
                <p className="text-xs text-slate-700 leading-relaxed">{detailModal.description}</p>
              </div>
            )}

            {/* Actions */}
            {detailModal.status === 'Resolved' || detailModal.status === 'HR In Process' ? (
              <div className="flex items-center justify-end gap-2 mb-3">
                <button
                  onClick={() => performAction(detailModal.id, 'hr-reject')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => performAction(detailModal.id, 'hr-inprocess')}
                  disabled={detailModal.status === 'HR In Process'}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  In Process
                </button>
                <button
                  onClick={() => performAction(detailModal.id, 'hr-approve')}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Approve & Close
                </button>
              </div>
            ) : (
              <div className="flex justify-end mb-3">
                <span className="text-[10px] text-slate-400 font-medium">Final decision made</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
              {detailModal.messages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No messages yet.</p>
                </div>
              ) : (
                detailModal.messages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-700">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{msg.senderRole}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Message */}
            <div className="pt-3 border-t border-slate-200/70">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
