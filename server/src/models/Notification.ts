import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userEmail: string;
  title: string;
  message: string;
  type: 'leave' | 'ticket' | 'attendance' | 'general';
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    type: {
      type: String,
      enum: ['leave', 'ticket', 'attendance', 'general'],
      default: 'general',
    },
    relatedId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userEmail: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
