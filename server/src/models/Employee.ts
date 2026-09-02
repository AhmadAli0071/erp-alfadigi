import mongoose, { Schema, Document } from 'mongoose';

export type DepartmentName = 'HR' | 'Sales' | 'Tech';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

export interface IEmployee extends Document {
  userId?: mongoose.Types.ObjectId;
  empId: string;
  name: string;
  email: string;
  department: DepartmentName;
  jobTitle: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;
  status: EmployeeStatus;
  reportedTo?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    empId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: {
      type: String,
      enum: ['HR', 'Sales', 'Tech'],
      required: true,
    },
    jobTitle: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    joinedDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
    },
    reportedTo: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ name: 'text', email: 'text', empId: 'text' });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
