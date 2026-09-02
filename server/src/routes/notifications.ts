import { Router, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { addClient } from '../services/notificationService.js';

const router = Router();

// GET /api/notifications/stream — SSE real-time stream (token via query param)
router.get('/stream', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const email = req.user?.email?.toLowerCase();
  if (!email) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ email })}\n\n`);

  const removeClient = addClient(email, res);

  req.on('close', () => {
    removeClient();
  });
});

// GET /api/notifications — my notifications (latest 50)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = req.user?.email?.toLowerCase();
    const notifications = await Notification.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      notifications: notifications.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Unable to load notifications.' });
  }
});

// GET /api/notifications/unread-count — badge count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = req.user?.email?.toLowerCase();
    const count = await Notification.countDocuments({ userEmail: email, isRead: false });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, userEmail: req.user?.email?.toLowerCase() },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Unable to mark as read.' });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { userEmail: _req.user?.email?.toLowerCase(), isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Unable to mark all as read.' });
  }
});

export default router;
