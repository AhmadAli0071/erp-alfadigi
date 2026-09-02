import { Router, Response } from 'express';
import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const clockInSchema = z.object({
  employeeEmail: z.string().email(),
});

const clockOutSchema = z.object({
  employeeEmail: z.string().email(),
});

const teamAttendanceSchema = z.object({
  leadEmail: z.string().email(),
  date: z.string().optional(),
});

// POST /api/attendance/clock-in
router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (existing && existing.clockIn) {
      res.status(409).json({ error: 'Already clocked in today.', attendance: existing });
      return;
    }

    let attendance;
    if (existing) {
      existing.clockIn = timeStr;
      existing.status = 'Present';
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        clockIn: timeStr,
        status: 'Present',
      });
    }

    res.json({ success: true, attendance: { id: attendance._id, clockIn: timeStr, status: 'Present' } });
  } catch (err) {
    console.error('Clock in error:', err);
    res.status(500).json({ error: 'Unable to clock in.' });
  }
});

// POST /api/attendance/clock-out
router.post('/clock-out', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = clockOutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const employee = await Employee.findOne({ email: parsed.data.employeeEmail.toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });

    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (!attendance || !attendance.clockIn) {
      res.status(400).json({ error: 'No clock-in found for today.' });
      return;
    }

    if (attendance.clockOut) {
      res.status(409).json({ error: 'Already clocked out today.' });
      return;
    }

    attendance.clockOut = timeStr;

    // Calculate working minutes
    const parseTime = (t: string) => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const clockInMin = parseTime(attendance.clockIn);
    const clockOutMin = parseTime(timeStr);
    let working = clockOutMin - clockInMin;
    if (working < 0) working += 24 * 60; // overnight shift
    working -= attendance.breakMinutes;
    attendance.workingMinutes = working;

    // Auto-assign status
    if (working >= 480) attendance.status = 'Present';
    else if (working >= 240) attendance.status = 'Half Day';
    else attendance.status = 'Short Hours';

    await attendance.save();

    res.json({
      success: true,
      attendance: {
        id: attendance._id,
        clockIn: attendance.clockIn,
        clockOut: timeStr,
        workingMinutes: working,
        status: attendance.status,
      },
    });
  } catch (err) {
    console.error('Clock out error:', err);
    res.status(500).json({ error: 'Unable to clock out.' });
  }
});

// GET /api/attendance/today/:email — get today's attendance for an employee
router.get('/today/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    res.json({
      attendance: attendance ? {
        id: attendance._id,
        clockIn: attendance.clockIn || null,
        clockOut: attendance.clockOut || null,
        breakMinutes: attendance.breakMinutes,
        workingMinutes: attendance.workingMinutes,
        status: attendance.status,
      } : null,
    });
  } catch (err) {
    console.error('Get today attendance error:', err);
    res.status(500).json({ error: 'Unable to load attendance.' });
  }
});

// GET /api/attendance/team/:leadEmail — get team attendance for a date
router.get('/team/:leadEmail', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leadParam = String(req.params.leadEmail);
    const date = String(req.query.date || new Date().toISOString().split('T')[0]);

    const leadEmployee = leadParam.includes('@')
      ? await Employee.findOne({ email: leadParam.toLowerCase(), isActive: true })
      : await Employee.findById(leadParam);

    if (!leadEmployee) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const teamMembers = await Employee.find({ reportedTo: leadEmployee._id, isActive: true });
    const teamIds = teamMembers.map((m) => m._id);

    const records = await Attendance.find({
      employeeId: { $in: teamIds },
      date,
    }).populate('employeeId', 'name empId department jobTitle');

    const allTeam = teamMembers.map((m) => {
      const record = records.find((r) => r.employeeId._id.toString() === m._id.toString());
      return {
        employeeId: m._id.toString(),
        employeeName: m.name,
        employeeCode: m.empId,
        department: m.department,
        jobTitle: m.jobTitle,
        date,
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null,
        breakMinutes: record?.breakMinutes || 0,
        workingMinutes: record?.workingMinutes || 0,
        status: record?.status || 'Absent',
      };
    });

    res.json({ date, team: allTeam });
  } catch (err) {
    console.error('Get team attendance error:', err);
    res.status(500).json({ error: 'Unable to load team attendance.' });
  }
});

// GET /api/attendance/history/:email — get attendance history for an employee
router.get('/history/:email', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: String(req.params.email).toLowerCase(), isActive: true });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const days = parseInt(String(req.query.days) || '30', 10);
    const records = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(days);

    res.json({
      employee: { id: employee._id, name: employee.name, empId: employee.empId },
      records: records.map((r) => ({
        id: r._id,
        date: r.date,
        clockIn: r.clockIn || null,
        clockOut: r.clockOut || null,
        breakMinutes: r.breakMinutes,
        workingMinutes: r.workingMinutes,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Get attendance history error:', err);
    res.status(500).json({ error: 'Unable to load attendance history.' });
  }
});

export default router;
