import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import { LeadDepartment } from '../../types/lead';
import { StatusBadge } from '../hr/StatusBadge';
import {
  Ticket,
  ArrowLeft,
  Search,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';

interface LeadTicketsViewProps {
  user: User;
  department: LeadDepartment;
  onNavigate: (route: string) => void;
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

const STATUS_OPTIONS = ['ALL', 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-indigo-100 text-indigo-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-rose-100 text-rose-700',
};

export const LeadTicketsView: React.FC<LeadTicketsViewProps> = ({
  user,
  department,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<TicketRecord | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/team/${user.email}?status=${selectedStatus}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError('Unable to load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email, selectedStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((t) =>
    !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    pending: tickets.filter((t) => t.status === 'Pending').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setShowDetailModal(null);
        fetchTickets();
      }
    } catch { /* ignore */ }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !showDetailModal) return;
    try {
      const res = await fetch(`${API_BASE}/tickets/${showDetailModal.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ senderEmail: user.email, message: newMessage }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setShowDetailModal({
          ...showDetailModal,
          messages: [...showDetailModal.messages, data.message],
        });
        setNewMessage('');
      }
    } catch { /* ignore */ }
  };

  const summaryCards = [
    { label: 'Open', value: summary.open, icon: <AlertCircle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
    { label: 'In Progress', value: summary.inProgress, icon: <Loader2 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
    { label: 'Pending', value: summary.pending, icon: <Clock className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-500/[0.04] border-violet-200' },
    { label: 'Resolved', value: summary.resolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
    { label: 'Closed', value: summary.closed, icon: <XCircle className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-500/[0.04] border-slate-200' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/lead/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Team Tickets</h1>
            <p className="text-xs text-slate-500 font-medium">{department} team support tickets</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((card, idx) => (
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
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">▾</span>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
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
          <p className="text-xs text-slate-400">Team support tickets will appear here.</p>
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
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => { setShowDetailModal(ticket); setSelectedNewStatus(ticket.status); }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-indigo-600">{ticket.ticketCode}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-slate-700">{ticket.employeeName}</div>
                      <div className="text-[10px] text-slate-500">{ticket.employeeCode}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{ticket.subject}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{ticket.ticketType}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ticket.status as 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => setShowDetailModal(null)} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <Ticket className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{showDetailModal.ticketCode}</h3>
                  <p className="text-[11px] text-slate-500">{showDetailModal.subject}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowDetailModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-500">{showDetailModal.employeeName}</span>
              <span className="text-[10px] text-slate-400">·</span>
              <StatusBadge status={showDetailModal.status as 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'} size="xs" />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[showDetailModal.priority] || 'bg-slate-100 text-slate-600'}`}>
                {showDetailModal.priority}
              </span>
            </div>

            {showDetailModal.description && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-3">
                <p className="text-xs text-slate-700 leading-relaxed">{showDetailModal.description}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-600">Update Status:</span>
              <div className="relative flex-1">
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  {['Open', 'In Progress', 'Pending', 'Resolved'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▾</span>
              </div>
              <button
                onClick={() => handleUpdateStatus(showDetailModal.id, selectedNewStatus)}
                disabled={selectedNewStatus === showDetailModal.status}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
              >
                Update
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
              {showDetailModal.messages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No messages yet.</p>
                </div>
              ) : (
                showDetailModal.messages.map((msg) => (
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
