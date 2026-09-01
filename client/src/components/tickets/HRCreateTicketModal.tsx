import React, { useState } from 'react';
import { TicketPriority, TicketType } from '../../types/ticket';
import { X, Plus, Paperclip, AlertCircle } from 'lucide-react';

interface HRCreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    subject: string;
    department: string;
    ticketType: TicketType;
    priority: TicketPriority;
    description: string;
  }) => Promise<void>;
}

export const HRCreateTicketModal: React.FC<HRCreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('HR');
  const [ticketType, setTicketType] = useState<TicketType>('General HR');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMessage('Please provide a ticket subject.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a ticket description.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSubmit({
        subject: subject.trim(),
        department,
        ticketType,
        priority,
        description: description.trim(),
      });
      // Reset form
      setSubject('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketTypes: TicketType[] = [
    'General HR',
    'Attendance Correction',
    'Leave Inquiry',
    'Payroll & Salary',
    'Hardware / IT',
    'Workplace / Facility',
    'Policy & Grievance',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-[3px] animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="hr-create-ticket-modal"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/70 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Create Ticket</h3>
              <p className="text-[11px] text-slate-500">Log a new internal HR support ticket</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Subject <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biometric attendance log discrepancy"
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="create-ticket-subject-input"
            />
          </div>

          {/* Department & Ticket Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                id="create-ticket-department-select"
              >
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Tech">Tech</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Ticket Type</label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as TicketType)}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                id="create-ticket-type-select"
              >
                {ticketTypes.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Urgent'] as TicketPriority[]).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setPriority(pr)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    priority === pr
                      ? 'bg-indigo-100/70 text-indigo-600 border-indigo-200 shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100/60'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, context, or requirements in detail..."
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              id="create-ticket-description-input"
            />
          </div>

          {/* Attachments Placeholder */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Attachments (Optional)</label>
            <div className="border border-dashed border-slate-200/80 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="text-xs text-slate-500">Click or drag files to attach</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-100/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors"
              id="create-ticket-submit-btn"
            >
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
