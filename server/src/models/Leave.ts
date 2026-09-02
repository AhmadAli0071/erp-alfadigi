import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  leadApproverId?: mongoose.Types.ObjectId;
  leadApprovalDate?: string;
  leadApprovalNote?: string;
  hrApproverId?: mongoose.Types.ObjectId;
  hrApprovalDate?: string;
  hrApprovalNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    leadApproverId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    leadApprovalDate: { type: String },
    leadApprovalNote: { type: String },
    hrApproverId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    hrApprovalDate: { type: String },
    hrApprovalNote: { type: String },
  },
  { timestamps: true }
);

LeaveSchema.index({ employeeId: 1 });
LeaveSchema.index({ status: 1 });

export const Leave = mongoose.model<ILeave>('Leave', LeaveSchema);
