import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types/auth';
import {
  Ticket,
  ArrowLeft,
  Search,
  Plus,
  ChevronDown,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  Send,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge } from '../hr/StatusBadge';

interface EmployeeTicketsViewProps {
  user: User;
  onNavigate: (route: string) => void;
}

const TICKET_TYPES = ['General HR', 'Attendance Correction', 'Leave Inquiry', 'Payroll & Salary', 'Hardware / IT', 'Workplace / Facility', 'Policy & Grievance', 'Other'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS = ['ALL', 'Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

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

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-indigo-100 text-indigo-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-rose-100 text-rose-700',
};

export const EmployeeTicketsView: React.FC<EmployeeTicketsViewProps> = ({
  user,
  onNavigate,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<TicketRecord | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Medium');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/my/${user.email}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError('Unable to load tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [user.email]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets
    .filter((t) => selectedStatus === 'ALL' || t.status === selectedStatus)
    .filter((t) => !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()));

  const summary = {
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    pending: tickets.filter((t) => t.status === 'Pending').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
  };

  const handleCreateTicket = async () => {
    setSubmitError(null);
    if (!ticketSubject.trim()) {
      setSubmitError('Subject is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          employeeEmail: user.email,
          subject: ticketSubject,
          description: ticketDescription,
          ticketType: ticketType || 'General HR',
          priority: ticketPriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to create ticket.');
        return;
      }
      setShowCreateForm(false);
      setTicketSubject('');
      setTicketDescription('');
      setTicketType('');
      setTicketPriority('Medium');
      fetchTickets();
    } catch {
      setSubmitError('Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
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
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/employee/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Tickets</h1>
            <p className="text-xs text-slate-500 font-medium">Support tickets and requests</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Open', value: summary.open, icon: <AlertCircle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-500/[0.04] border-amber-200' },
          { label: 'In Progress', value: summary.inProgress, icon: <Loader2 className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-500/[0.04] border-blue-200' },
          { label: 'Pending', value: summary.pending, icon: <Clock className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-500/[0.04] border-violet-200' },
          { label: 'Resolved', value: summary.resolved, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-500/[0.04] border-emerald-200' },
          { label: 'Closed', value: summary.closed, icon: <XCircle className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-500/[0.04] border-slate-200' },
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
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets List */}
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
          <p className="text-xs text-slate-400">Your support tickets will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-5 py-3.5">Ticket</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right pr-5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setShowDetailModal(ticket)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-indigo-600">{ticket.ticketCode}</td>
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
                    <td className="px-5 py-3.5 text-xs text-slate-500 text-right pr-5">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[3px]" onClick={() => { setShowCreateForm(false); setSubmitError(null); }} />
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg p-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <Ticket className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Ticket</h3>
                  <p className="text-[11px] text-slate-500">Submit a support request</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowCreateForm(false); setSubmitError(null); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-4">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-700 font-medium">{submitError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ticket Type</label>
                <div className="relative">
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">Select ticket type</option>
                    {TICKET_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief subject of your request"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
                <div className="flex items-center gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTicketPriority(p)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        ticketPriority === p
                          ? p === 'Urgent' ? 'bg-rose-600 text-white shadow-md' :
                            p === 'High' ? 'bg-orange-500 text-white shadow-md' :
                            p === 'Medium' ? 'bg-indigo-600 text-white shadow-md' :
                            'bg-slate-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setSubmitError(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTicket}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating…' : 'Create Ticket'}</span>
              </button>
            </div>
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

            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={showDetailModal.status as 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'} size="xs" />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[showDetailModal.priority] || 'bg-slate-100 text-slate-600'}`}>
                {showDetailModal.priority}
              </span>
              <span className="text-[10px] text-slate-500 ml-auto">{showDetailModal.ticketType}</span>
            </div>

            {showDetailModal.description && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-4">
                <p className="text-xs text-slate-700 leading-relaxed">{showDetailModal.description}</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
              {showDetailModal.messages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No messages yet.</p>
                </div>
              ) : (
                showDetailModal.messages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-white border border-slate-200/70">
                    <div className="flex items-center gap-2 mb-1.5">
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 cursor-pointer"
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
