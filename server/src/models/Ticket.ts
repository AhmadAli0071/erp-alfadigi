import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: Date;
}

export interface ITicket extends Document {
  ticketCode: string;
  subject: string;
  description: string;
  employeeId: mongoose.Types.ObjectId;
  department: string;
  ticketType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Pending' | 'In Progress' | 'Resolved' | 'HR In Process' | 'Closed' | 'Rejected';
  assignedTo?: mongoose.Types.ObjectId;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>(
  {
    ticketCode: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    department: { type: String, required: true },
    ticketType: { type: String, default: 'General HR' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'Pending', 'In Progress', 'Resolved', 'HR In Process', 'Closed', 'Rejected'],
      default: 'Open',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    messages: [TicketMessageSchema],
  },
  { timestamps: true }
);

TicketSchema.index({ employeeId: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ status: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
