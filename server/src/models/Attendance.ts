import mongoose, { Schema, Document } from 'mongoose';

export type BreakType = 'LUNCH' | 'NAMAZ' | 'WASHROOM';

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
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Work From Home' | 'On Duty' | 'Pending OT' | 'Short Hours';
  notes?: string;
  isAutoMarked?: boolean;
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
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Work From Home', 'On Duty', 'Pending OT', 'Short Hours'],
      default: 'Absent',
    },
    notes: { type: String, default: '' },
    isAutoMarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
