import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'DEPARTMENT_LEAD' | 'EMPLOYEE';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  jobTitle: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'EMPLOYEE'],
      default: 'EMPLOYEE',
    },
    department: { type: String, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
