import mongoose from 'mongoose';
import { config } from './config.js';
import { Employee } from './models/Employee.js';

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

const seedEmployees = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    for (const emp of SEED_EMPLOYEES) {
      const existing = await Employee.findOne({ email: emp.email });
      if (existing) {
        console.log(`⏭  Skipped (exists): ${emp.empId} — ${emp.name}`);
        continue;
      }

      await Employee.create(emp);
      console.log(`✅ Created: ${emp.empId} — ${emp.name} (${emp.department})`);
    }

    console.log('\n🎉 Employee seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Employee seed failed:', err);
    process.exit(1);
  }
};

seedEmployees();
