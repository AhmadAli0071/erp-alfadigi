import { Employee } from '../models/Employee.js';

/**
 * Next free employee id (highest existing numeric suffix + 1).
 * Uses the max suffix instead of the document count so gaps left by
 * deleted employees (or a previously failed insert) never collide.
 */
export async function nextEmpId(): Promise<string> {
  const docs = await Employee.find({}).select('empId').lean();
  let max = 0;
  for (const doc of docs) {
    const n = Number(String(doc.empId).replace(/^EMP-/, ''));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `EMP-${String(max + 1).padStart(3, '0')}`;
}
