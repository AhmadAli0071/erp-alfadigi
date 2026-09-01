import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD', 'EMPLOYEE']).default('EMPLOYEE'),
  department: z.string().optional(),
  jobTitle: z.string().min(1, 'Job title is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register — HR creates a new user account
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { name, email, password, role, department, jobTitle } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      jobTitle,
      createdBy: req.user?.name || 'System',
    });

    res.status(201).json({
      success: true,
      account: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        password,
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

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
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
      expiresIn: config.jwtExpiresIn,
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
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in.' });
  }
});

// GET /api/auth/me — get current user from token
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
  });
});

// GET /api/auth/accounts — list all user accounts (HR only)
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

export default router;
