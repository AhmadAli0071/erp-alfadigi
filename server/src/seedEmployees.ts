import mongoose from 'mongoose';
import { config } from './config.js';
import { Employee } from './models/Employee.js';
import { User } from './models/User.js';

const SEED_EMPLOYEES = [
  {
    empId: 'EMP-001',
    name: 'HR Admin',
    email: 'hr@alfadigi.local',
    department: 'HR',
    jobTitle: 'Head of People & Culture',
    phone: '+92 300 1234567',
    joinedDate: '2024-01-15',
    status: 'Active',
  },
  {
    empId: 'EMP-002',
    name: 'Sales Lead',
    email: 'saleslead@alfadigi.local',
    department: 'Sales',
    jobTitle: 'Director of Enterprise Sales',
    phone: '+92 301 2345678',
    joinedDate: '2024-02-01',
    status: 'Active',
  },
  {
    empId: 'EMP-003',
    name: 'Tech Lead',
    email: 'techlead@alfadigi.local',
    department: 'Tech',
    jobTitle: 'Principal Engineering Lead',
    phone: '+92 302 3456789',
    joinedDate: '2024-02-01',
    status: 'Active',
  },
  {
    empId: 'EMP-004',
    name: 'Sales Associate',
    email: 'employee@alfadigi.local',
    department: 'Sales',
    jobTitle: 'Account Executive',
    phone: '+92 303 4567890',
    joinedDate: '2024-06-15',
    status: 'Active',
  },
];

const REPORTING_LINES = [
  { employeeEmail: 'saleslead@alfadigi.local', leadEmail: 'hr@alfadigi.local' },
  { employeeEmail: 'techlead@alfadigi.local', leadEmail: 'hr@alfadigi.local' },
  { employeeEmail: 'employee@alfadigi.local', leadEmail: 'saleslead@alfadigi.local' },
];

const seedEmployees = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    for (const emp of SEED_EMPLOYEES) {
      const existing = await Employee.findOne({ email: emp.email });
      if (existing) {
        console.log(`⏭  Skipped (exists): ${emp.empId} - ${emp.name}`);
        continue;
      }

      await Employee.create(emp);
      console.log(`✅ Created: ${emp.empId} - ${emp.name} (${emp.department})`);
    }

    // Wire the reporting hierarchy so the lead approval flow works out of the box
    for (const line of REPORTING_LINES) {
      const emp = await Employee.findOne({ email: line.employeeEmail });
      const lead = await Employee.findOne({ email: line.leadEmail });
      if (!emp || !lead) {
        console.log(`⏭  Reporting line skipped: ${line.employeeEmail} → ${line.leadEmail} (missing records)`);
        continue;
      }
      if (emp.reportedTo && emp.reportedTo.toString() === lead._id.toString()) {
        console.log(`⏭  Reporting line already set: ${emp.name} → ${lead.name}`);
        continue;
      }
      emp.reportedTo = lead._id;
      await emp.save();
      console.log(`✅ Reporting line: ${emp.name} → ${lead.name}`);
    }

    // Link login accounts (userId) where missing
    const unlinked = await Employee.find({ $or: [{ userId: { $exists: false } }, { userId: null }] });
    for (const emp of unlinked) {
      const user = await User.findOne({ email: emp.email });
      if (user) {
        emp.userId = user._id;
        await emp.save();
        console.log(`✅ Linked login account: ${emp.name}`);
      }
    }

    console.log('\n🎉 Employee seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Employee seed failed:', err);
    process.exit(1);
  }
};

seedEmployees();
