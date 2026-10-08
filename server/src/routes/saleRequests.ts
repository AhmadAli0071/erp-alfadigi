import { Router, Response } from 'express';
import { z } from 'zod';
import { SaleRequest, ISaleRequest } from '../models/SaleRequest.js';
import { Sale } from '../models/Sale.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { createNotification, notifyEmails } from '../services/notificationService.js';
import { monthRangeFromKey } from '../utils/commission.js';

const router = Router();

const createRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  clientName: z.string().min(1, 'Client name is required').max(120),
  clientEmail: z.string().max(160).optional(),
  clientPhone: z.string().max(40).optional(),
  clientCompany: z.string().max(160).optional(),
  clientAddress: z.string().max(300).optional(),
  saleDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

type RequestDoc = ISaleRequest;

// Full serialization - Super Admin only (contains client info)
const serializeFull = (r: RequestDoc) => ({
  id: r._id.toString(),
  employeeId: r.employeeId.toString(),
  employeeName: r.employeeName,
  employeeEmail: r.employeeEmail,
  amount: r.amount,
  clientName: r.clientName,
  clientEmail: r.clientEmail,
  clientPhone: r.clientPhone,
  clientCompany: r.clientCompany,
  clientAddress: r.clientAddress,
  saleDate: r.saleDate.toISOString(),
  description: r.description,
  requestedByName: r.requestedByName,
  requestedByEmail: r.requestedByEmail,
  status: r.status,
  reviewedBy: r.reviewedBy,
  reviewedByRole: r.reviewedByRole,
  reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
});

// Limited serialization - HR only (NO client info, per business rule)
const serializeLimited = (r: RequestDoc) => ({
  id: r._id.toString(),
  employeeName: r.employeeName,
  employeeEmail: r.employeeEmail,
  amount: r.amount,
  saleDate: r.saleDate.toISOString(),
  requestedByName: r.requestedByName,
  status: r.status,
  reviewedBy: r.reviewedBy,
  reviewedByRole: r.reviewedByRole,
  createdAt: r.createdAt.toISOString(),
});

const parseDate = (raw?: string): Date => {
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

// POST /api/sale-requests - Sales Lead submits a sale request (full client form)
router.post(
  '/',
  authenticate,
  requireRole('DEPARTMENT_LEAD'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { employeeId, amount, clientName, clientEmail, clientPhone, clientCompany, clientAddress, saleDate, description } = parsed.data;

      // Requester must be a Sales department lead
      const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
      if (!requester || requester.department !== 'Sales') {
        res.status(403).json({ error: 'Only Sales department leads can submit sale requests.' });
        return;
      }

      // Target employee: active Sales EMPLOYEE (agent)
      const employee = await Employee.findById(employeeId);
      if (!employee || !employee.isActive) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }
      if (employee.department !== 'Sales') {
        res.status(400).json({ error: 'Earning can only be reported for Sales department employees.' });
        return;
      }
      const employeeUser = await User.findOne({ email: employee.email.toLowerCase() });
      if (!employeeUser || employeeUser.role !== 'EMPLOYEE') {
        res.status(400).json({ error: 'Earning can only be reported for Sales agents (employees).' });
        return;
      }

      const request = await SaleRequest.create({
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        amount,
        clientName,
        clientEmail: clientEmail || '',
        clientPhone: clientPhone || '',
        clientCompany: clientCompany || '',
        clientAddress: clientAddress || '',
        saleDate: parseDate(saleDate),
        description: description || '',
        requestedByName: req.user!.name,
        requestedByEmail: req.user!.email,
      });

      // Notify all Super Admins + HR Admins
      const [superAdmins, hrAdmins] = await Promise.all([
        User.find({ role: 'SUPER_ADMIN', isActive: true }).select('email'),
        User.find({ role: 'HR_ADMIN', isActive: true }).select('email'),
      ]);
      const recipients = [...superAdmins.map((u) => u.email), ...hrAdmins.map((u) => u.email)];
      await notifyEmails(recipients, {
        title: 'New Sale Request',
        message: `${req.user!.name} reported a sale of PKR ${amount.toLocaleString('en-US')} for ${employee.name}. Pending approval.`,
        type: 'general',
        relatedId: request._id.toString(),
      });

      res.status(201).json({
        success: true,
        message: 'Sale request submitted. Sent to Super Admin and HR.',
        request: serializeFull(request),
      });
    } catch (err) {
      console.error('Create sale request error:', err);
      res.status(500).json({ error: 'Unable to submit sale request.' });
    }
  }
);

// GET /api/sale-requests/options - Sales agents dropdown for the lead
router.get(
  '/options',
  authenticate,
  requireRole('DEPARTMENT_LEAD'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const requester = await Employee.findOne({ email: req.user!.email.toLowerCase(), isActive: true });
      if (!requester || requester.department !== 'Sales') {
        res.status(403).json({ error: 'Only Sales department leads can view this.' });
        return;
      }
      const agents = await Employee.find({ department: 'Sales', isActive: true }).sort({ name: 1 });
      const users = await User.find({ isActive: true }).select('email role');
      const roleByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.role]));
      const options = agents
        .filter((e) => roleByEmail.get(e.email.toLowerCase()) === 'EMPLOYEE')
        .map((e) => ({ id: e._id.toString(), name: e.name, email: e.email, jobTitle: e.jobTitle }));
      res.json({ options });
    } catch (err) {
      console.error('Sale request options error:', err);
      res.status(500).json({ error: 'Unable to load employee options.' });
    }
  }
);

// GET /api/sale-requests?status= - SA: full detail, HR: limited (no client info), Lead: own (full)
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const role = req.user!.role;
      if (!['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_LEAD'].includes(role)) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return;
      }

      const statusFilter = String(req.query.status || '');
      const filter: Record<string, unknown> = {};
      if (['Pending', 'Approved', 'Rejected'].includes(statusFilter)) {
        filter.status = statusFilter;
      }
      if (role === 'DEPARTMENT_LEAD') {
        filter.requestedByEmail = req.user!.email.toLowerCase();
      }

      const requests = await SaleRequest.find(filter).sort({ createdAt: -1 }).limit(200);
      res.json({
        requests: requests.map((r) =>
          role === 'HR_ADMIN' ? serializeLimited(r) : serializeFull(r)
        ),
      });
    } catch (err) {
      console.error('List sale requests error:', err);
      res.status(500).json({ error: 'Unable to load sale requests.' });
    }
  }
);

// PUT /api/sale-requests/:id/approve - HR or SA (first one wins) -> creates the earning entry
router.put(
  '/:id/approve',
  authenticate,
  requireRole('SUPER_ADMIN', 'HR_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const request = await SaleRequest.findById(req.params.id);
      if (!request) {
        res.status(404).json({ error: 'Sale request not found.' });
        return;
      }
      if (request.status !== 'Pending') {
        res.status(400).json({ error: `This request was already ${request.status.toLowerCase()} by ${request.reviewedBy || 'another reviewer'}.` });
        return;
      }

      request.status = 'Approved';
      request.reviewedBy = req.user!.name;
      request.reviewedByRole = req.user!.role;
      request.reviewedAt = new Date();
      await request.save();

      // This earning now counts - the commission engine calculates from it
      const sale = await Sale.create({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        employeeEmail: request.employeeEmail,
        amount: request.amount,
        clientName: request.clientName,
        description: request.description || `Sale request (client: ${request.clientCompany || request.clientName})`,
        saleDate: request.saleDate,
        createdBy: `${req.user!.name} (approved sale request)`,
        createdByEmail: req.user!.email,
      });

      await createNotification({
        userEmail: request.requestedByEmail,
        title: 'Sale Request Approved',
        message: `${req.user!.name} (${req.user!.role === 'HR_ADMIN' ? 'HR' : 'Super Admin'}) approved the sale request: PKR ${request.amount.toLocaleString('en-US')} for ${request.employeeName}. Earning updated.`,
        type: 'general',
        relatedId: sale._id.toString(),
      });

      res.json({
        success: true,
        message: 'Sale request approved. Earning has been added.',
        request: serializeFull(request),
      });
    } catch (err) {
      console.error('Approve sale request error:', err);
      res.status(500).json({ error: 'Unable to approve sale request.' });
    }
  }
);

// PUT /api/sale-requests/:id/reject - HR or SA (first one wins)
router.put(
  '/:id/reject',
  authenticate,
  requireRole('SUPER_ADMIN', 'HR_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const request = await SaleRequest.findById(req.params.id);
      if (!request) {
        res.status(404).json({ error: 'Sale request not found.' });
        return;
      }
      if (request.status !== 'Pending') {
        res.status(400).json({ error: `This request was already ${request.status.toLowerCase()} by ${request.reviewedBy || 'another reviewer'}.` });
        return;
      }

      request.status = 'Rejected';
      request.reviewedBy = req.user!.name;
      request.reviewedByRole = req.user!.role;
      request.reviewedAt = new Date();
      await request.save();

      await createNotification({
        userEmail: request.requestedByEmail,
        title: 'Sale Request Rejected',
        message: `${req.user!.name} rejected the sale request: PKR ${request.amount.toLocaleString('en-US')} for ${request.employeeName}.`,
        type: 'general',
        relatedId: request._id.toString(),
      });

      res.json({
        success: true,
        message: 'Sale request rejected.',
        request: serializeFull(request),
      });
    } catch (err) {
      console.error('Reject sale request error:', err);
      res.status(500).json({ error: 'Unable to reject sale request.' });
    }
  }
);

// GET /api/sale-requests/summary?month=YYYY-MM - lead's own monthly summary (approved requests)
router.get(
  '/summary',
  authenticate,
  requireRole('DEPARTMENT_LEAD'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const range = monthRangeFromKey(req.query.month);
      const agg = await SaleRequest.aggregate([
        {
          $match: {
            requestedByEmail: req.user!.email.toLowerCase(),
            saleDate: { $gte: range.start, $lt: range.end },
          },
        },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]);
      const by = (s: string) => agg.find((a) => a._id === s) || { total: 0, count: 0 };
      res.json({
        month: range.key,
        pending: by('Pending'),
        approved: by('Approved'),
        rejected: by('Rejected'),
      });
    } catch (err) {
      console.error('Sale request summary error:', err);
      res.status(500).json({ error: 'Unable to load summary.' });
    }
  }
);

export default router;
