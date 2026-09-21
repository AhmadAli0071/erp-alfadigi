import { AuthRequest } from '../middleware/auth.js';
import { Employee } from '../models/Employee.js';

export const HR_ROLES = ['HR_ADMIN', 'SUPER_ADMIN'];

export const isHr = (req: AuthRequest): boolean =>
  !!req.user && HR_ROLES.includes(req.user.role);

/**
 * Access rule for reading/acting on an employee's data:
 * - the employee themself
 * - HR admins
 * - the lead the employee reports to
 */
export const canAccessEmployee = async (
  req: AuthRequest,
  targetEmail: string
): Promise<boolean> => {
  if (!req.user) return false;
  const requesterEmail = req.user.email.toLowerCase();
  if (requesterEmail === targetEmail.toLowerCase()) return true;
  if (HR_ROLES.includes(req.user.role)) return true;

  const requester = await Employee.findOne({
    email: requesterEmail,
    isActive: true,
  });
  if (!requester) return false;

  const target = await Employee.findOne({
    email: targetEmail.toLowerCase(),
  });
  if (!target || !target.reportedTo) return false;

  return target.reportedTo.toString() === requester._id.toString();
};

/** Lead-only guard: requester must be the exact lead the target reports to. */
export const isAssignedLead = async (
  req: AuthRequest,
  targetEmail: string
): Promise<boolean> => {
  if (!req.user) return false;
  const requester = await Employee.findOne({
    email: req.user.email.toLowerCase(),
    isActive: true,
  });
  if (!requester) return false;

  const target = await Employee.findOne({
    email: targetEmail.toLowerCase(),
  });
  if (!target || !target.reportedTo) return false;

  return target.reportedTo.toString() === requester._id.toString();
};
