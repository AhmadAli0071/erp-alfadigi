import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  code: string;
  annualQuota: number;
  carryForwardLimit: number;
  isPaid: boolean;
  requiresLeadApproval: boolean;
  requiresDocument: boolean;
  description: string;
  colorBadge: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    annualQuota: { type: Number, required: true, min: 0, max: 365 },
    carryForwardLimit: { type: Number, default: 0, min: 0, max: 365 },
    isPaid: { type: Boolean, default: true },
    requiresLeadApproval: { type: Boolean, default: true },
    requiresDocument: { type: Boolean, default: false },
    description: { type: String, default: '' },
    colorBadge: { type: String, default: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LeaveTypeSchema.index({ code: 1 }, { unique: true });
LeaveTypeSchema.index({ isActive: 1, order: 1 });

export const LeaveType = mongoose.model<ILeaveType>('LeaveType', LeaveTypeSchema);
