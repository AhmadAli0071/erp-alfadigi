import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User } from './models/User.js';

const DEFAULT_ACCOUNTS = [
  {
    name: 'Super Admin',
    email: 'admin@alfadigi.local',
    role: 'SUPER_ADMIN',
    jobTitle: 'Global System Administrator',
  },
  {
    name: 'HR Admin',
    email: 'hr@alfadigi.local',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    jobTitle: 'Head of People & Culture',
  },
  {
    name: 'Sales Lead',
    email: 'saleslead@alfadigi.local',
    role: 'DEPARTMENT_LEAD',
    department: 'Sales',
    jobTitle: 'Director of Enterprise Sales',
  },
  {
    name: 'Tech Lead',
    email: 'techlead@alfadigi.local',
    role: 'DEPARTMENT_LEAD',
    department: 'Tech',
    jobTitle: 'Principal Engineering Lead',
  },
  {
    name: 'Sales Associate',
    email: 'employee@alfadigi.local',
    role: 'EMPLOYEE',
    department: 'Sales',
    jobTitle: 'Account Executive',
  },
];

const SEED_PASSWORD = 'Admin@123';

const seed = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);

    for (const account of DEFAULT_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        console.log(`⏭  Skipped (exists): ${account.email}`);
        continue;
      }

      await User.create({
        ...account,
        password: hashedPassword,
        createdBy: 'Seed Script',
      });
      console.log(`✅ Created: ${account.email} (${account.role})`);
    }

    console.log('\n🎉 Seed complete! All default accounts ready.');
    console.log(`\n🔑 Default password for all accounts: ${SEED_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
