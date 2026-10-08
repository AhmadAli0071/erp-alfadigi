import { Router, Response } from 'express';
import { z } from 'zod';
import { Sale, ISale } from '../models/Sale.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { createNotification, notifyEmails } from '../services/notificationService.js';
import { computeCommission, monthRangeFromKey, monthlyTargetForRole } from '../utils/commission.js';

const router = Router();

const createSaleSchema = z.object({
  employeeId: z.string().min(1, 'Sales person is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  clientName: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
  saleDate: z.string().optional(),
});

type SaleDoc = ISale;

const serialize = (s: SaleDoc) => ({
  id: s._id.toString(),
  employeeId: s.employeeId.toString(),
  employeeName: s.employeeName,
  employeeEmail: s.employeeEmail,
  amount: s.amount,
  clientName: s.clientName,
  description: s.description,
  saleDate: s.saleDate.toISOString(),
  createdBy: s.createdBy,
  createdByEmail: s.createdByEmail,
  createdAt: s.createdAt.toISOString(),
});

const parseDate = (raw?: string): Date => {
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

// POST /api/sales - Super Admin (full detail) or HR (employee + amount) adds the earning directly
router.post(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN', 'HR_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createSaleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { employeeId, amount, clientName, description, saleDate } = parsed.data;

      const employee = await Employee.findById(employeeId);
      if (!employee || !employee.isActive) {
        res.status(404).json({ error: 'Sales person not found.' });
        return;
      }
      if (employee.department !== 'Sales') {
        res.status(400).json({ error: 'Commission is only tracked for the Sales department.' });
        return;
      }

      const sale = await Sale.create({
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        amount,
        clientName: clientName || '',
        description: description || '',
        saleDate: parseDate(saleDate),
        createdBy: req.user!.name,
        createdByEmail: req.user!.email,
      });

      // HR added it directly - audit notification to Super Admins
      if (req.user!.role === 'HR_ADMIN') {
        const superAdmins = await User.find({ role: 'SUPER_ADMIN', isActive: true }).select('email');
        await notifyEmails(
          superAdmins.map((u) => u.email),
          {
            title: 'Earning Added by HR',
            message: `HR ${req.user!.name} added PKR ${amount.toLocaleString('en-US')} earning for ${employee.name}.`,
            type: 'general',
            relatedId: sale._id.toString(),
          }
        );
      }

      res.status(201).json({ success: true, sale: serialize(sale) });
    } catch (err) {
      console.error('Create sale error:', err);
      res.status(500).json({ error: 'Unable to record sale.' });
    }
  }
);

// GET /api/sales?employeeId=&month=YYYY-MM - list sales (Super Admin only)
router.get(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);
      const filter: Record<string, unknown> = {
        saleDate: { $gte: range.start, $lt: range.end },
      };
      if (typeof req.query.employeeId === 'string' && req.query.employeeId) {
        filter.employeeId = req.query.employeeId;
      }

      const sales = await Sale.find(filter).sort({ saleDate: -1 }).limit(300);
      res.json({ month: range.key, sales: sales.map(serialize) });
    } catch (err) {
      console.error('List sales error:', err);
      res.status(500).json({ error: 'Unable to load sales.' });
    }
  }
);

// DELETE /api/sales/:id - Super Admin removes a wrong entry
router.delete(
  '/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const sale = await Sale.findByIdAndDelete(req.params.id);
      if (!sale) {
        res.status(404).json({ error: 'Sale not found.' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Delete sale error:', err);
      res.status(500).json({ error: 'Unable to delete sale.' });
    }
  }
);

// GET /api/sales/earnings?month=YYYY-MM - HR + SA: how much each employee earned (NO client info, NO commission)
router.get(
  '/earnings',
  authenticate,
  requireRole('SUPER_ADMIN', 'HR_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);
      const [employees, aggs] = await Promise.all([
        Employee.find({ department: 'Sales', isActive: true }).sort({ name: 1 }),
        Sale.aggregate([
          { $match: { saleDate: { $gte: range.start, $lt: range.end } } },
          { $group: { _id: '$employeeId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);
      const totalByEmp = new Map(aggs.map((a) => [a._id.toString(), a]));
      const earnings = employees.map((e) => {
        const agg = totalByEmp.get(e._id.toString());
        return {
          employeeId: e._id.toString(),
          name: e.name,
          email: e.email,
          jobTitle: e.jobTitle,
          totalSales: agg?.total || 0,
          salesCount: agg?.count || 0,
        };
      });
      res.json({ month: range.key, earnings });
    } catch (err) {
      console.error('Earnings summary error:', err);
      res.status(500).json({ error: 'Unable to load earnings.' });
    }
  }
);

// GET /api/sales/commission?month=YYYY-MM - per-person commission summary (Super Admin only)
router.get(
  '/commission',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);

      const [employees, users, aggs] = await Promise.all([
        Employee.find({ department: 'Sales', isActive: true }).sort({ name: 1 }),
        User.find({ isActive: true }).select('email role'),
        Sale.aggregate([
          { $match: { saleDate: { $gte: range.start, $lt: range.end } } },
          { $group: { _id: '$employeeId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

      const roleByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.role]));
      const totalByEmp = new Map(aggs.map((a) => [a._id.toString(), a]));

      const summary = employees.map((e) => {
        const role = roleByEmail.get(e.email.toLowerCase()) || 'EMPLOYEE';
        const agg = totalByEmp.get(e._id.toString());
        const total = agg?.total || 0;
        const target = monthlyTargetForRole(role);
        return {
          employeeId: e._id.toString(),
          name: e.name,
          email: e.email,
          jobTitle: e.jobTitle,
          role,
          salesCount: agg?.count || 0,
          ...computeCommission(total, target),
        };
      });

      res.json({ month: range.key, summary });
    } catch (err) {
      console.error('Commission summary error:', err);
      res.status(500).json({ error: 'Unable to load commission summary.' });
    }
  }
);

// GET /api/sales/commission/my - my own commission (Sales EMPLOYEE / DEPARTMENT_LEAD)
router.get(
  '/commission/my',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);

      const employee = await Employee.findOne({
        email: req.user!.email.toLowerCase(),
        isActive: true,
      });

      const isSalesPerson =
        employee &&
        employee.department === 'Sales' &&
        ['EMPLOYEE', 'DEPARTMENT_LEAD'].includes(req.user!.role);

      if (!isSalesPerson) {
        res.json({
          eligible: false,
          month: range.key,
          totalSales: 0,
          target: 0,
          unlocked: false,
          extraAmount: 0,
          commission: 0,
          rate: 0,
          salesCount: 0,
        });
        return;
      }

      const [agg] = await Sale.aggregate([
        {
          $match: {
            employeeId: employee!._id,
            saleDate: { $gte: range.start, $lt: range.end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]);

      const target = monthlyTargetForRole(req.user!.role);
      res.json({
        eligible: true,
        month: range.key,
        role: req.user!.role,
        salesCount: agg?.count || 0,
        ...computeCommission(agg?.total || 0, target),
      });
    } catch (err) {
      console.error('My commission error:', err);
      res.status(500).json({ error: 'Unable to load your commission.' });
    }
  }
);

// GET /api/sales/my?month=YYYY-MM - my own sales entries
router.get(
  '/my',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);
      const employee = await Employee.findOne({ email: req.user!.email.toLowerCase() });
      if (!employee) {
        res.json({ month: range.key, sales: [] });
        return;
      }
      const sales = await Sale.find({
        employeeId: employee._id,
        saleDate: { $gte: range.start, $lt: range.end },
      })
        .sort({ saleDate: -1 })
        .limit(100);
      res.json({ month: range.key, sales: sales.map(serialize) });
    } catch (err) {
      console.error('My sales error:', err);
      res.status(500).json({ error: 'Unable to load your sales.' });
    }
  }
);

export default router;
