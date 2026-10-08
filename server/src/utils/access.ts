import { AuthRequest } from '../middleware/auth.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { notifyEmails } from '../services/notificationService.js';

export const HR_ROLES = ['HR_ADMIN', 'SUPER_ADMIN'];

export const isHr = (req: AuthRequest): boolean =>
  !!req.user && HR_ROLES.includes(req.user.role);

export const isHod = (req: AuthRequest): boolean =>
  !!req.user && req.user.role === 'HOD';

/**
 * The department an HOD manages. Authoritative source is the Employee record
 * (enum: HR | Sales | Tech); User.department is a free-form fallback.
 * Returns null when the requester is not an HOD or has no department set.
 */
export const hodDepartment = async (req: AuthRequest): Promise<string | null> => {
  if (!isHod(req)) return null;
  const emp = await Employee.findOne({ email: req.user!.email.toLowerCase() }).select('department');
  const dept = emp?.department || req.user!.department;
  return dept || null;
};

/** Active HOD user accounts that manage the given department (emails). */
export const hodEmailsForDepartment = async (dept: string | null): Promise<string[]> => {
  if (!dept) return [];
  const hodUsers = await User.find({ role: 'HOD', isActive: true }).select('email department');
  if (hodUsers.length === 0) return [];
  const emails = hodUsers.map((u) => u.email.toLowerCase());
  const emps = await Employee.find({ email: { $in: emails } }).select('email department');
  const deptOf = new Map(emps.map((e) => [e.email.toLowerCase(), e.department]));
  return emails.filter((email) => {
    const employeeDept = deptOf.get(email) || hodUsers.find((u) => u.email.toLowerCase() === email)?.department;
    return employeeDept === dept;
  });
};

/**
 * True when the department has a HOD (other than `excludeEmail`) who can take
 * the first approval step. Used to decide whether HR may act on a Pending item.
 */
export const deptHasApprover = async (dept: string | null, excludeEmail?: string): Promise<boolean> => {
  const emails = await hodEmailsForDepartment(dept);
  const exclude = excludeEmail?.toLowerCase();
  return emails.some((e) => e !== exclude);
};

/** Notifies every HOD of the given department. Falls back to HR when none exists. */
export const notifyDeptHods = async (
  dept: string | null,
  input: { title: string; message: string; relatedId?: string; type: 'leave' | 'ticket' },
  fallbackToHr?: () => Promise<void>
): Promise<void> => {
  const emails = await hodEmailsForDepartment(dept);
  if (emails.length === 0) {
    if (fallbackToHr) await fallbackToHr();
    return;
  }
  await notifyEmails(emails, input);
};

/**
 * Access rule for reading/acting on an employee's data:
 * - the employee themself
 * - HR admins
 * - the HOD (sees everyone, read-oriented)
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
  if (req.user.role === 'HOD') return true;

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
