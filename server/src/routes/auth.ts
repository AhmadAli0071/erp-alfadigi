import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'EMPLOYEE']).default('EMPLOYEE'),
  department: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required'),
  reportedTo: z.string().optional(),
  salary: z.coerce.number().min(0, 'Salary cannot be negative').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const accountStatusSchema = z.object({ isActive: z.boolean() });
const accountRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'EMPLOYEE']),
});
const accountPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const STRONG_PASSWORD_MESSAGE = 'Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a symbol.';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password.',
  });

/** HR_ADMIN cannot manage SUPER_ADMIN accounts; SUPER_ADMIN can manage everyone. */
const canManageAccount = (actorRole: string, targetRole: string): boolean =>
  actorRole === 'SUPER_ADMIN' ? true : targetRole !== 'SUPER_ADMIN';

// POST /api/auth/register - HR creates a new user account
router.post(
  '/register',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user || !['HR_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return;
      }

      const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { name, email, password, role, department, jobTitle, reportedTo, salary } = parsed.data;

    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only a Super Admin can create Super Admin accounts.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // HR / Super Admin both may set the starting salary at account creation.
    // (HR's own salary stays invisible to them - visibility rules handle that.)
    const salaryValue = salary || 0;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      jobTitle,
      createdBy: req.user?.name || 'System',
      mustChangePassword: true,
    });

    console.warn(`[audit] Account created: ${email} (${role}) by ${req.user?.email} (${req.user?.role}) from IP ${req.ip}`);

    // Also create Employee record so user appears in employee directory
    let employeeCreated = false;
    for (let attempt = 0; attempt < 5 && !employeeCreated; attempt++) {
      const empCount = await Employee.countDocuments();
      const empId = `EMP-${String(empCount + 1 + attempt).padStart(3, '0')}`;
      try {
        await Employee.create({
          userId: user._id,
          empId,
          name,
          email: email.toLowerCase(),
          department: department || 'Sales',
          jobTitle,
          salary: salaryValue,
          phone: '',
          joinedDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          reportedTo: reportedTo || undefined,
        });
        employeeCreated = true;
      } catch (err) {
        const dupCode = (err as { code?: number })?.code;
        if (dupCode !== 11000 || attempt === 4) throw err;
      }
    }

    res.status(201).json({
      success: true,
      account: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Unable to create account.' });
  }
});

// POST /api/auth/login - max 10 attempts per IP per 15 minutes
router.post('/login', rateLimit(10, 15 * 60 * 1000), async (req, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in.' });
  }
});

// GET /api/auth/me - get current user from token
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  res.json({
    id: req.user._id.toString(),
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    department: req.user.department,
    jobTitle: req.user.jobTitle,
    mustChangePassword: !!req.user.mustChangePassword,
  });
});

// PUT /api/auth/change-password - logged-in user changes their own password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    console.warn(`[audit] Password CHANGE: ${user.email} (self) from IP ${req.ip}`);

    res.json({ success: true, message: 'Password updated successfully. Use your new password next time.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Unable to change password.' });
  }
});

// GET /api/auth/accounts - list all user accounts (HR only)
router.get('/accounts', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !['HR_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    res.status(403).json({ error: 'Insufficient permissions.' });
    return;
  }

  const accounts = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    accounts: accounts.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      jobTitle: u.jobTitle,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    })),
  });
});

// PUT /api/auth/accounts/:id/status - activate/deactivate an account
router.put('/accounts/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !['HR_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    const parsed = accountStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const target = await User.findById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    if (!canManageAccount(req.user.role, target.role)) {
      res.status(403).json({ error: 'Only a Super Admin can modify Super Admin accounts.' });
      return;
    }
    if (!parsed.data.isActive && target._id.toString() === req.user._id.toString()) {
      res.status(400).json({ error: 'You cannot deactivate your own account.' });
      return;
    }
    target.isActive = parsed.data.isActive;
    await target.save();
    console.warn(`[audit] Account ${target.isActive ? 'ACTIVATED' : 'DEACTIVATED'}: ${target.email} by ${req.user.email} (${req.user.role}) from IP ${req.ip}`);
    res.json({ success: true, account: { id: target._id.toString(), isActive: target.isActive } });
  } catch (err) {
    console.error('Account status error:', err);
    res.status(500).json({ error: 'Unable to update account status.' });
  }
});

// PUT /api/auth/accounts/:id/role - change an account's role (Super Admin only)
router.put('/accounts/:id/role', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only a Super Admin can change account roles.' });
      return;
    }
    const parsed = accountRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const target = await User.findById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    if (target._id.toString() === req.user._id.toString()) {
      res.status(400).json({ error: 'You cannot change your own role.' });
      return;
    }
    target.role = parsed.data.role;
    await target.save();
    console.warn(`[audit] Role changed to ${target.role}: ${target.email} by ${req.user.email} (${req.user.role}) from IP ${req.ip}`);
    res.json({ success: true, account: { id: target._id.toString(), role: target.role } });
  } catch (err) {
    console.error('Account role error:', err);
    res.status(500).json({ error: 'Unable to change account role.' });
  }
});

// PUT /api/auth/accounts/:id/password - reset an account's password
router.put('/accounts/:id/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !['HR_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    const parsed = accountPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const target = await User.findById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    if (!canManageAccount(req.user.role, target.role)) {
      res.status(403).json({ error: 'Only a Super Admin can reset Super Admin passwords.' });
      return;
    }
    target.password = await bcrypt.hash(parsed.data.password, 12);
    target.mustChangePassword = true;
    await target.save();
    console.warn(`[audit] Password RESET: ${target.email} by ${req.user.email} (${req.user.role}) from IP ${req.ip}`);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Account password reset error:', err);
    res.status(500).json({ error: 'Unable to reset password.' });
  }
});

export default router;
