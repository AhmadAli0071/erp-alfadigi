import React, { useState } from 'react';
import {
  TicketItem,
  TicketPriority,
  TicketStatus,
} from '../../types/ticket';
import {
  X,
  User,
  Building2,
  Calendar,
  Clock,
  Send,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
  Archive,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface HRTicketDetailDrawerProps {
  ticket: TicketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, notes?: string) => Promise<void>;
  onAssignTicket: (ticketId: string, assignee: string) => Promise<void>;
  onSendMessage: (ticketId: string, text: string) => Promise<void>;
}

export const HRTicketDetailDrawer: React.FC<HRTicketDetailDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateStatus,
  onAssignTicket,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'conversation' | 'activity'>('conversation');
  const [messageInput, setMessageInput] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState<TicketStatus | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSubmittingMessage) return;

    try {
      setIsSubmittingMessage(true);
      await onSendMessage(ticket.id, messageInput.trim());
      setMessageInput('');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assigneeName.trim()) return;
    await onAssignTicket(ticket.id, assigneeName.trim());
    setIsAssigning(false);
    setAssigneeName('');
  };

  const handleStatusSubmit = async (newStatus: TicketStatus) => {
    await onUpdateStatus(ticket.id, newStatus, statusChangeNote);
    setIsChangingStatus(null);
    setStatusChangeNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/25 backdrop-blur-[3px] animate-fadeIn">
      <div
        className="w-full md:w-[600px] lg:w-[680px] h-full bg-white/85 backdrop-blur-2xl border-l border-slate-200/80 sm:rounded-l-3xl flex flex-col shadow-2xl overflow-hidden"
        id="hr-ticket-detail-drawer"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100/70 text-indigo-600 border border-indigo-200 font-mono text-xs font-bold shrink-0">
              {ticket.ticketCode}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</h3>
              <p className="text-[11px] text-slate-500 truncate">{ticket.ticketType}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
              <div className="text-xs font-semibold text-slate-900">{ticket.status}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
              <div className="text-xs font-semibold text-amber-600">{ticket.priority}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
              <div className="text-xs font-semibold text-slate-700">{ticket.department}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Created</span>
              <div className="text-xs font-semibold text-slate-600">{ticket.createdDate}</div>
            </div>
          </div>

          {/* Employee & Assignee Information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100/70 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{ticket.employeeName}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {ticket.employeeCode} • {ticket.department}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Assigned To</div>
                <div className="text-xs font-medium text-slate-600">
                  {ticket.assignedTo || 'Unassigned'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssigning(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100/60 hover:bg-slate-200/50 text-xs font-semibold text-slate-600 border border-slate-200/80 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>

          {/* Assign Prompt Modal Overlay */}
          {isAssigning && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="text-xs font-semibold text-indigo-600">Assign Ticket</div>
              <input
                type="text"
                placeholder="Enter HR or Lead name..."
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssigning(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubmit}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Description
            </div>
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {ticket.description || 'No description provided.'}
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              HR Actions
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleStatusSubmit('In Progress')}
                className="px-3 py-2 rounded-xl bg-indigo-100/70 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-semibold transition-colors"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                onClick={() => handleStatusSubmit('Resolved')}
                className="px-3 py-2 rounded-xl bg-emerald-100/70 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs font-semibold transition-colors"
              >
                Resolve Ticket
              </button>
              <button
                type="button"
                onClick={() => handleStatusSubmit('Closed')}
                className="px-3 py-2 rounded-xl bg-slate-100/60 hover:bg-slate-200/50 text-slate-600 border border-slate-200/80 text-xs font-semibold transition-colors"
              >
                Close Ticket
              </button>
            </div>
          </div>

          {/* Conversation & Activity Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('conversation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'conversation'
                    ? 'bg-indigo-100/70 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Conversation ({ticket.messages?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'activity'
                    ? 'bg-indigo-100/70 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Activity Timeline ({ticket.activity?.length || 0})
              </button>
            </div>

            {activeTab === 'conversation' ? (
              <div className="space-y-3">
                {/* Messages list */}
                {!ticket.messages || ticket.messages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-200/70">
                    No messages yet
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {ticket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border ${
                          msg.senderRole === 'HR'
                            ? 'bg-indigo-50 border-indigo-200 ml-6'
                            : 'bg-slate-50 border-slate-200/70 mr-6'
                        } space-y-1`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-900">
                            {msg.senderName} ({msg.senderRole})
                          </span>
                          <span className="text-slate-400 font-mono">{msg.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Send reply form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your reply as HR..."
                    className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSubmittingMessage}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Activity Timeline */
              <div className="space-y-3">
                {!ticket.activity || ticket.activity.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-200/70">
                    No activity records
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200/50">
                    {ticket.activity.map((act) => (
                      <div key={act.id} className="relative pl-7 text-xs space-y-0.5">
                        <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-100/70 border border-indigo-500" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{act.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{act.details}</div>
                        <div className="text-slate-400 text-[10px] font-mono">By: {act.actorName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
