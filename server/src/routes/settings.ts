import { Router, Response } from 'express';
import { z } from 'zod';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { DEFAULT_SETTINGS, deepMerge, ensureSettings } from '../utils/defaults.js';

const router = Router();

const SETTINGS_SECTIONS = ['general', 'attendance', 'overtime', 'leave', 'notifications', 'workflow', 'security'] as const;

const saveSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()).refine(
    (val) => Object.keys(val).length > 0 && Object.keys(val).every((k) => (SETTINGS_SECTIONS as readonly string[]).includes(k)),
    { message: 'Settings payload must contain at least one valid section.' }
  ),
});

// GET /api/settings — full system settings (HR only)
router.get('/', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const value = await ensureSettings();
    res.json({ settings: value });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Unable to load settings.' });
  }
});

// PUT /api/settings — save settings (HR only, deep-merged per section)
router.put('/', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = saveSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const current = await ensureSettings();
    const merged = deepMerge(current, parsed.data.settings);

    await SystemSetting.updateOne(
      { key: 'global' },
      { $set: { value: merged, updatedBy: req.user!.email.toLowerCase() } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Settings saved successfully.', settings: merged });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Unable to save settings.' });
  }
});

// PUT /api/settings/reset — restore factory defaults (HR only)
router.put('/reset', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await SystemSetting.updateOne(
      { key: 'global' },
      { $set: { value: DEFAULT_SETTINGS, updatedBy: req.user!.email.toLowerCase() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Settings restored to system defaults.', settings: DEFAULT_SETTINGS });
  } catch (err) {
    console.error('Reset settings error:', err);
    res.status(500).json({ error: 'Unable to reset settings.' });
  }
});

export default router;
