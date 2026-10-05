import mongoose, { Schema, Document } from 'mongoose';

export interface ISalarySnapshot extends Document {
  month: string; // YYYY-MM
  employeeId: mongoose.Types.ObjectId;
  empId: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  baseSalary: number;
  perDayRate: number;
  requiredHoursPerDay: number;
  expectedDays: number;
  expectedMinutes: number;
  workedMinutes: number;
  otMinutes: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  shortfallMinutes: number;
  countableMinutes: number;
  payable: number;
  deduction: number;
  finalPayable: number;
  log: SalaryLogEntry[];
  lockedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

export interface SalaryLogEntry {
  date: string;
  type: '-' | '+';
  reason: string;
  minutes: number;
  amount: number;
}

const SalaryLogEntrySchema = new Schema<SalaryLogEntry>(
  {
    date: { type: String, required: true },
    type: { type: String, enum: ['-', '+'], required: true },
    reason: { type: String, required: true },
    minutes: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const SalarySnapshotSchema = new Schema<ISalarySnapshot>(
  {
    month: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    empId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    jobTitle: { type: String, default: '' },
    baseSalary: { type: Number, default: 0 },
    perDayRate: { type: Number, default: 0 },
    requiredHoursPerDay: { type: Number, default: 8 },
    expectedDays: { type: Number, default: 30 },
    expectedMinutes: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    otMinutes: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    shortfallMinutes: { type: Number, default: 0 },
    countableMinutes: { type: Number, default: 0 },
  payable: { type: Number, default: 0 },
  deduction: { type: Number, default: 0 },
  finalPayable: { type: Number, default: 0 },
    log: { type: [SalaryLogEntrySchema], default: [] },
    lockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SalarySnapshotSchema.index({ month: 1, employeeId: 1 }, { unique: true });
SalarySnapshotSchema.index({ month: 1, department: 1 });

export const SalarySnapshot = mongoose.model<ISalarySnapshot>('SalarySnapshot', SalarySnapshotSchema);
