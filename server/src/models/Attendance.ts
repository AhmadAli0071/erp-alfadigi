import mongoose, { Schema, Document } from 'mongoose';

export type BreakType = 'LUNCH' | 'NAMAZ' | 'WASHROOM';
export type ReviewStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string;
  clockIn?: string;
  clockInAt?: Date | null;
  clockOut?: string;
  clockOutAt?: Date | null;
  breakMinutes: number;
  breakStartedAt?: Date | null;
  breakType?: BreakType | null;
  breakMinutesByType: { lunch: number; namaz: number; washroom: number };
  workingMinutes: number;
  /** HR set working minutes manually — auto clock-out sweep must not overwrite them */
  hoursManuallySet?: boolean;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Work From Home' | 'On Duty' | 'Pending OT' | 'Short Hours';
  notes?: string;
  isAutoMarked?: boolean;
  /** Employee-requested attendance correction (wrong punch / missing punch etc.) */
  correctionStatus: ReviewStatus;
  correctionReason: string;
  correctionNote: string;
  /** Employee-requested overtime approval for extra hours worked */
  otStatus: ReviewStatus;
  otReason: string;
  otNote: string;
  otApprovedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    clockIn: { type: String },
    clockInAt: { type: Date, default: null },
    clockOut: { type: String },
    clockOutAt: { type: Date, default: null },
    breakMinutes: { type: Number, default: 0 },
    breakStartedAt: { type: Date, default: null },
    breakType: { type: String, enum: ['LUNCH', 'NAMAZ', 'WASHROOM'], default: null },
    breakMinutesByType: {
      lunch: { type: Number, default: 0 },
      namaz: { type: Number, default: 0 },
      washroom: { type: Number, default: 0 },
    },
    workingMinutes: { type: Number, default: 0 },
    hoursManuallySet: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Work From Home', 'On Duty', 'Pending OT', 'Short Hours'],
      default: 'Absent',
    },
    notes: { type: String, default: '' },
    isAutoMarked: { type: Boolean, default: false },
    correctionStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },
    correctionReason: { type: String, default: '' },
    correctionNote: { type: String, default: '' },
    otStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },
    otReason: { type: String, default: '' },
    otNote: { type: String, default: '' },
    otApprovedMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
