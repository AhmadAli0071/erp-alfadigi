import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  pinned: boolean;
  isActive: boolean;
  postedByName: string;
  postedByEmail: string;
  postedByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    pinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    postedByName: { type: String, required: true },
    postedByEmail: { type: String, required: true },
    postedByRole: { type: String, required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, pinned: 1, createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
