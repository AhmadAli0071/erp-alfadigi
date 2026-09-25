import mongoose, { Schema, Document } from 'mongoose';

export type SalaryRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ISalaryChangeRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  currentSalary: number;
  newSalary: number;
  reason?: string;
  requestedByName: string;
  requestedByEmail: string;
  status: SalaryRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryChangeRequestSchema = new Schema<ISalaryChangeRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true, lowercase: true, trim: true },
    currentSalary: { type: Number, required: true, min: 0 },
    newSalary: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SalaryChangeRequestSchema.index({ status: 1 });
SalaryChangeRequestSchema.index({ employeeId: 1 });

export const SalaryChangeRequest = mongoose.model<ISalaryChangeRequest>(
  'SalaryChangeRequest',
  SalaryChangeRequestSchema
);
