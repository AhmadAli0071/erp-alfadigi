import { Router, Response } from 'express';
import { z } from 'zod';
import { LeaveType, ILeaveType } from '../models/LeaveType.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { isHr } from '../utils/access.js';
import { ensureLeaveTypes } from '../utils/defaults.js';

const router = Router();

const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactCaseInsensitive = (input: string): string => `^${escapeRegex(input)}$`;

const COLOR_PRESETS = [
  'bg-indigo-500/15 text-indigo-600 border-indigo-500/30',
  'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'bg-purple-500/15 text-purple-600 border-purple-500/30',
  'bg-sky-500/15 text-sky-600 border-sky-500/30',
  'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30',
];

const createTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(60),
  code: z.string().trim().min(1, 'Code is required.').max(6),
  annualQuota: z.number().int().min(0).max(365),
  carryForwardLimit: z.number().int().min(0).max(365).optional(),
  isPaid: z.boolean().optional(),
  requiresLeadApproval: z.boolean().optional(),
  requiresDocument: z.boolean().optional(),
  description: z.string().trim().max(300).optional(),
  colorBadge: z.string().optional(),
});

const updateTypeSchema = createTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const serializeType = (t: ILeaveType) => ({
  id: String(t._id),
  name: t.name,
  code: t.code,
  annualQuota: t.annualQuota,
  carryForwardLimit: t.carryForwardLimit,
  isPaid: t.isPaid,
  requiresLeadApproval: t.requiresLeadApproval,
  requiresDocument: t.requiresDocument,
  description: t.description,
  colorBadge: t.colorBadge,
  order: t.order,
  isActive: t.isActive,
});

// GET /api/leave-types — list leave types (any authenticated user; inactive only for HR)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureLeaveTypes();
    const includeInactive = isHr(req) && String(req.query.includeInactive || '') === '1';
    const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };
    const types = await LeaveType.find(filter).sort({ order: 1, name: 1 });
    res.json({ types: types.map(serializeType) });
  } catch (err) {
    console.error('Get leave types error:', err);
    res.status(500).json({ error: 'Unable to load leave types.' });
  }
});

// POST /api/leave-types — create a leave type (HR only)
router.post('/', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const data = parsed.data;
    const name = data.name;
    const code = data.code.toUpperCase();

    const dup = await LeaveType.findOne({
      $or: [{ name: { $regex: exactCaseInsensitive(name), $options: 'i' } }, { code }],
    });
    if (dup) {
      res.status(409).json({ error: `A leave type with this ${dup.code === code ? 'code' : 'name'} already exists.` });
      return;
    }

    const maxOrderDoc = await LeaveType.findOne().sort({ order: -1 }).select('order');
    const colorBadge = data.colorBadge && COLOR_PRESETS.includes(data.colorBadge)
      ? data.colorBadge
      : COLOR_PRESETS[(maxOrderDoc?.order ?? 0) % COLOR_PRESETS.length];

    const leaveType = await LeaveType.create({
      name,
      code,
      annualQuota: data.annualQuota,
      carryForwardLimit: data.carryForwardLimit ?? 0,
      isPaid: data.isPaid ?? true,
      requiresLeadApproval: data.requiresLeadApproval ?? true,
      requiresDocument: data.requiresDocument ?? false,
      description: data.description ?? '',
      colorBadge,
      order: (maxOrderDoc?.order ?? 0) + 1,
      isActive: true,
    });

    res.status(201).json({ success: true, type: serializeType(leaveType) });
  } catch (err) {
    const dupCode = (err as { code?: number })?.code;
    if (dupCode === 11000) {
      res.status(409).json({ error: 'A leave type with this code already exists.' });
      return;
    }
    console.error('Create leave type error:', err);
    res.status(500).json({ error: 'Unable to create leave type.' });
  }
});

// PUT /api/leave-types/:id — update a leave type (HR only)
router.put('/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) {
      res.status(404).json({ error: 'Leave type not found.' });
      return;
    }

    const parsed = updateTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const data = parsed.data;

    if (data.name || data.code) {
      const dupConditions: Record<string, unknown>[] = [];
      if (data.name) dupConditions.push({ name: { $regex: exactCaseInsensitive(data.name), $options: 'i' } });
      if (data.code) dupConditions.push({ code: data.code.toUpperCase() });
      const dup = await LeaveType.findOne({ _id: { $ne: leaveType._id }, $or: dupConditions });
      if (dup) {
        res.status(409).json({ error: `A leave type with this ${data.code && dup.code === data.code.toUpperCase() ? 'code' : 'name'} already exists.` });
        return;
      }
    }

    if (data.name !== undefined) leaveType.name = data.name;
    if (data.code !== undefined) leaveType.code = data.code.toUpperCase();
    if (data.annualQuota !== undefined) leaveType.annualQuota = data.annualQuota;
    if (data.carryForwardLimit !== undefined) leaveType.carryForwardLimit = data.carryForwardLimit;
    if (data.isPaid !== undefined) leaveType.isPaid = data.isPaid;
    if (data.requiresLeadApproval !== undefined) leaveType.requiresLeadApproval = data.requiresLeadApproval;
    if (data.requiresDocument !== undefined) leaveType.requiresDocument = data.requiresDocument;
    if (data.description !== undefined) leaveType.description = data.description;
    if (data.colorBadge !== undefined && COLOR_PRESETS.includes(data.colorBadge)) leaveType.colorBadge = data.colorBadge;
    if (data.isActive !== undefined) leaveType.isActive = data.isActive;

    await leaveType.save();
    res.json({ success: true, type: serializeType(leaveType) });
  } catch (err) {
    const dupCode = (err as { code?: number })?.code;
    if (dupCode === 11000) {
      res.status(409).json({ error: 'A leave type with this code already exists.' });
      return;
    }
    console.error('Update leave type error:', err);
    res.status(500).json({ error: 'Unable to update leave type.' });
  }
});

// DELETE /api/leave-types/:id — deactivate a leave type (HR only, soft delete)
router.delete('/:id', authenticate, requireRole('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) {
      res.status(404).json({ error: 'Leave type not found.' });
      return;
    }

    // Soft delete — existing leave records keep referencing the name
    leaveType.isActive = false;
    await leaveType.save();

    res.json({ success: true, message: 'Leave type deactivated. Existing leave records are unaffected.' });
  } catch (err) {
    console.error('Delete leave type error:', err);
    res.status(500).json({ error: 'Unable to deactivate leave type.' });
  }
});

export default router;
