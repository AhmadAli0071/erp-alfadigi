import mongoose, { Schema, Document } from 'mongoose';

export type AdjustmentType = 'bonus' | 'deduction' | 'override';

export interface ISalaryAdjustment extends Document {
  month: string; // YYYY-MM
  employeeId: mongoose.Types.ObjectId;
  empId: string;
  name: string;
  email: string;
  department: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  byName: string;
  byEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryAdjustmentSchema = new Schema<ISalaryAdjustment>(
  {
    month: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    empId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    type: { type: String, enum: ['bonus', 'deduction', 'override'], required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    byName: { type: String, required: true },
    byEmail: { type: String, required: true },
  },
  { timestamps: true }
);

SalaryAdjustmentSchema.index({ month: 1, employeeId: 1 });
SalaryAdjustmentSchema.index({ month: 1, type: 1 });

export const SalaryAdjustment = mongoose.model<ISalaryAdjustment>('SalaryAdjustment', SalaryAdjustmentSchema);
