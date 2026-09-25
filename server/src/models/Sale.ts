import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  clientName: string;
  description: string;
  saleDate: Date;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true, trim: true },
    employeeEmail: { type: String, required: true, lowercase: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    clientName: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    saleDate: { type: Date, required: true },
    createdBy: { type: String, default: '' },
    createdByEmail: { type: String, default: '', lowercase: true, trim: true },
  },
  { timestamps: true }
);

SaleSchema.index({ employeeId: 1, saleDate: -1 });
SaleSchema.index({ saleDate: -1 });

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
