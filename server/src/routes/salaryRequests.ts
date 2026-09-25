import { Router, Response } from 'express';
import { z } from 'zod';
import { SalaryChangeRequest, ISalaryChangeRequest } from '../models/SalaryChangeRequest.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';
import { createNotification, notifyEmails } from '../services/notificationService.js';

const router = Router();

const createRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  newSalary: z.coerce.number().positive('New salary must be greater than 0'),
  reason: z.string().max(300).optional(),
});

type SalaryRequestDoc = ISalaryChangeRequest;

const serialize = (r: SalaryRequestDoc) => ({
  id: r._id.toString(),
  employeeId: r.employeeId.toString(),
  employeeName: r.employeeName,
  employeeEmail: r.employeeEmail,
  currentSalary: r.currentSalary,
  newSalary: r.newSalary,
  reason: r.reason,
  requestedByName: r.requestedByName,
  requestedByEmail: r.requestedByEmail,
  status: r.status,
  reviewedBy: r.reviewedBy,
  reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
});

// POST /api/salary-requests - HR raises a salary change request (Super Admin approves)
router.post(
  '/',
  authenticate,
  requireRole('HR_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { employeeId, newSalary, reason } = parsed.data;

      const employee = await Employee.findById(employeeId);
      if (!employee || !employee.isActive) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      // HR can never change their own salary - that is Super Admin's job
      if (employee.email.toLowerCase() === req.user!.email.toLowerCase()) {
        res.status(403).json({ error: 'You cannot change your own salary.' });
        return;
      }

      if (employee.salary === newSalary) {
        res.status(400).json({ error: 'New salary is the same as the current salary.' });
        return;
      }

      // Replace any existing pending request for the same employee by this HR
      await SalaryChangeRequest.deleteMany({
        employeeId: employee._id,
        requestedByEmail: req.user!.email.toLowerCase(),
        status: 'Pending',
      });

      const request = await SalaryChangeRequest.create({
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        currentSalary: employee.salary,
        newSalary,
        reason: reason || '',
        requestedByName: req.user!.name,
        requestedByEmail: req.user!.email,
      });

      // Notify all Super Admins so they can approve
      const superAdmins = await User.find({ role: 'SUPER_ADMIN', isActive: true }).select('email');
      await notifyEmails(
        superAdmins.map((u) => u.email),
        {
          title: 'Salary Change Request',
          message: `${req.user!.name} requested a salary change for ${employee.name}: Rs ${employee.salary.toLocaleString('en-US')} → Rs ${newSalary.toLocaleString('en-US')}.`,
          type: 'general',
          relatedId: request._id.toString(),
        }
      );

      res.status(201).json({
        success: true,
        message: 'Salary change request sent to Super Admin for approval.',
        request: serialize(request),
      });
    } catch (err) {
      console.error('Create salary request error:', err);
      res.status(500).json({ error: 'Unable to create salary request.' });
    }
  }
);

// GET /api/salary-requests?status=Pending - list requests (Super Admin only)
router.get(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const statusFilter = String(req.query.status || '');
      const filter: Record<string, unknown> = {};
      if (['Pending', 'Approved', 'Rejected'].includes(statusFilter)) {
        filter.status = statusFilter;
      }
      const requests = await SalaryChangeRequest.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json({ requests: requests.map(serialize) });
    } catch (err) {
      console.error('List salary requests error:', err);
      res.status(500).json({ error: 'Unable to load salary requests.' });
    }
  }
);

// PUT /api/salary-requests/:id/approve - Super Admin approves and applies the change
router.put(
  '/:id/approve',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const request = await SalaryChangeRequest.findById(req.params.id);
      if (!request) {
        res.status(404).json({ error: 'Salary request not found.' });
        return;
      }
      if (request.status !== 'Pending') {
        res.status(400).json({ error: 'This request has already been reviewed.' });
        return;
      }

      request.status = 'Approved';
      request.reviewedBy = req.user!.name;
      request.reviewedAt = new Date();
      await request.save();

      const employee = await Employee.findByIdAndUpdate(
        request.employeeId,
        { $set: { salary: request.newSalary } },
        { new: true }
      );

      await createNotification({
        userEmail: request.requestedByEmail,
        title: 'Salary Change Approved',
        message: `Super Admin approved the salary change for ${request.employeeName}: Rs ${request.currentSalary.toLocaleString('en-US')} → Rs ${request.newSalary.toLocaleString('en-US')}.`,
        type: 'general',
        relatedId: request._id.toString(),
      });

      res.json({
        success: true,
        message: 'Salary request approved and applied.',
        request: serialize(request),
        employeeSalary: employee?.salary,
      });
    } catch (err) {
      console.error('Approve salary request error:', err);
      res.status(500).json({ error: 'Unable to approve salary request.' });
    }
  }
);

// PUT /api/salary-requests/:id/reject - Super Admin rejects the request
router.put(
  '/:id/reject',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const request = await SalaryChangeRequest.findById(req.params.id);
      if (!request) {
        res.status(404).json({ error: 'Salary request not found.' });
        return;
      }
      if (request.status !== 'Pending') {
        res.status(400).json({ error: 'This request has already been reviewed.' });
        return;
      }

      request.status = 'Rejected';
      request.reviewedBy = req.user!.name;
      request.reviewedAt = new Date();
      await request.save();

      await createNotification({
        userEmail: request.requestedByEmail,
        title: 'Salary Change Rejected',
        message: `Super Admin rejected the salary change request for ${request.employeeName} (Rs ${request.newSalary.toLocaleString('en-US')}).`,
        type: 'general',
        relatedId: request._id.toString(),
      });

      res.json({
        success: true,
        message: 'Salary request rejected.',
        request: serialize(request),
      });
    } catch (err) {
      console.error('Reject salary request error:', err);
      res.status(500).json({ error: 'Unable to reject salary request.' });
    }
  }
);

export default router;
