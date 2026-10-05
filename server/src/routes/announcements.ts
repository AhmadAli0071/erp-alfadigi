import { Router, Response } from 'express';
import { z } from 'zod';
import { Announcement } from '../models/Announcement.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { notifyEmails } from '../services/notificationService.js';

const router = Router();

const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  body: z.string().trim().min(1, 'Announcement body is required').max(4000, 'Announcement is too long'),
  pinned: z.boolean().optional(),
});

const serialize = (a: typeof Announcement.prototype) => ({
  id: a._id.toString(),
  title: a.title,
  body: a.body,
  pinned: a.pinned,
  postedByName: a.postedByName,
  postedByEmail: a.postedByEmail,
  postedByRole: a.postedByRole,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

// GET /api/announcements - all authenticated users, pinned first then newest
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await Announcement.find({ isActive: true }).sort({ pinned: -1, createdAt: -1 }).limit(100);
    res.json({ announcements: items.map(serialize) });
  } catch (err) {
    console.error('Announcements list error:', err);
    res.status(500).json({ error: 'Unable to load announcements.' });
  }
});

// POST /api/announcements - HR/SA posts + notifies every active user
router.post('/', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { title, body, pinned } = parsed.data;
    const announcement = await Announcement.create({
      title,
      body,
      pinned: !!pinned,
      postedByName: req.user!.name,
      postedByEmail: req.user!.email,
      postedByRole: req.user!.role,
    });
    console.warn(`[audit] Announcement POSTED: "${title}" by ${req.user!.email}`);

    // Notify every active user (in-app + SSE push - real-time boards refresh)
    const users = await User.find({ isActive: true }).select('email');
    await notifyEmails(
      users.map((u) => u.email),
      {
        title: 'New Announcement',
        message: `${req.user!.name} posted an announcement: ${title}`,
        type: 'general',
        relatedId: announcement._id.toString(),
      }
    );

    res.status(201).json({ success: true, announcement: serialize(announcement), notified: users.length });
  } catch (err) {
    console.error('Announcement create error:', err);
    res.status(500).json({ error: 'Unable to post announcement.' });
  }
});

// PUT /api/announcements/:id - HR/SA edits any announcement
router.put('/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = announcementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement || !announcement.isActive) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }
    announcement.title = parsed.data.title;
    announcement.body = parsed.data.body;
    announcement.pinned = parsed.data.pinned ?? announcement.pinned;
    await announcement.save();
    console.warn(`[audit] Announcement EDITED: "${announcement.title}" by ${req.user!.email}`);
    res.json({ success: true, announcement: serialize(announcement) });
  } catch (err) {
    console.error('Announcement edit error:', err);
    res.status(500).json({ error: 'Unable to update announcement.' });
  }
});

// PUT /api/announcements/:id/pin - HR/SA toggles pin
router.put('/:id/pin', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement || !announcement.isActive) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }
    announcement.pinned = !announcement.pinned;
    await announcement.save();
    res.json({ success: true, pinned: announcement.pinned });
  } catch (err) {
    console.error('Announcement pin error:', err);
    res.status(500).json({ error: 'Unable to update pin.' });
  }
});

// DELETE /api/announcements/:id - HR/SA soft delete
router.delete('/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement || !announcement.isActive) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }
    announcement.isActive = false;
    await announcement.save();
    console.warn(`[audit] Announcement DELETED: "${announcement.title}" by ${req.user!.email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Announcement delete error:', err);
    res.status(500).json({ error: 'Unable to delete announcement.' });
  }
});

export default router;
