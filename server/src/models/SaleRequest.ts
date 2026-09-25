import mongoose, { Schema, Document } from 'mongoose';

export type SaleRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ISaleRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  clientAddress: string;
  saleDate: Date;
  description: string;
  requestedByName: string;
  requestedByEmail: string;
  status: SaleRequestStatus;
  reviewedBy: string;
  reviewedByRole: string;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SaleRequestSchema = new Schema<ISaleRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true, trim: true },
    employeeEmail: { type: String, required: true, lowercase: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    clientName: { type: String, default: '', trim: true },
    clientEmail: { type: String, default: '', trim: true },
    clientPhone: { type: String, default: '', trim: true },
    clientCompany: { type: String, default: '', trim: true },
    clientAddress: { type: String, default: '', trim: true },
    saleDate: { type: Date, required: true },
    description: { type: String, default: '', trim: true },
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedBy: { type: String, default: '' },
    reviewedByRole: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SaleRequestSchema.index({ status: 1 });
SaleRequestSchema.index({ requestedByEmail: 1 });
SaleRequestSchema.index({ employeeId: 1 });

export const SaleRequest = mongoose.model<ISaleRequest>('SaleRequest', SaleRequestSchema);
