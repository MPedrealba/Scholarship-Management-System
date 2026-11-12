import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import { User } from './models/User.js';

export const USERS_PER_ROLE = [
  {
    email: 'admin@earist.edu.ph',
    password: 'password123',
    role: 'admin',
    name: 'Dr. Rogelio T. Mamaradlo',
    college: null,
    employeeId: 'ADM-2024-001',
    studentNumber: null,
    isActive: true,
  },
  {
    email: 'evaluator@earist.edu.ph',
    password: 'password123',
    role: 'evaluator',
    name: 'Prof. Noel Carpio',
    college: 'CIT',
    employeeId: 'EVL-CIT-004',
    studentNumber: null,
    isActive: true,
  },
  {
    email: 'student@earist.edu.ph',
    password: 'password123',
    role: 'student',
    name: 'Juan Dela Cruz',
    college: 'CIT',
    employeeId: null,
    studentNumber: '2023-01849-MN-0',
    isActive: true,
  },
];

export async function seedOneUserPerRole() {
  // Synchronize local db_store.json with clean seeded accounts
  try {
    const storePath = path.resolve(__dirname, 'data/db_store.json');
    if (fs.existsSync(storePath)) {
      const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (Array.isArray(storeData.users)) {
        for (const userData of USERS_PER_ROLE) {
          const hash = bcrypt.hashSync(userData.password, 10);
          const existingIdx = storeData.users.findIndex(
            (u) => u.email && u.email.toLowerCase() === userData.email.toLowerCase()
          );
          const userObj = {
            ...userData,
            password: hash,
          };
          if (existingIdx !== -1) {
            storeData.users[existingIdx] = { ...storeData.users[existingIdx], ...userObj };
          } else {
            storeData.users.push(userObj);
          }
        }
        fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2));
        console.log(' Synchronized local db_store.json with seeded user accounts.');
      }
    }
  } catch (err) {
    console.warn(' Local store update notice:', err.message);
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      console.log(' Connected to MongoDB Atlas for seeding.');
    }

    // Clean existing users to ensure strictly 1 user per role
    await User.deleteMany({});
    console.log(' Cleared previous user records.');

    const createdUsers = [];
    for (const userData of USERS_PER_ROLE) {
      // Create user with pre-save bcrypt hashing
      const user = new User(userData);
      await user.save();
      createdUsers.push({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        college: user.college,
        defaultPassword: userData.password,
      });
      console.log(` Created [${user.role.toUpperCase()}]: ${user.email} (${user.name})`);
    }

    console.log('\n Successfully seeded exactly 1 user per role:');
    console.table(createdUsers);
    return createdUsers;
  } catch (error) {
    console.error(' Seeding failed:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log(' Disconnected from MongoDB Atlas.');
    }
  }
}

// Run directly if invoked via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedOneUserPerRole()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
