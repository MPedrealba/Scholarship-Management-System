import dotenv from 'dotenv';
import path from 'path';
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
  },
  {
    email: 'evaluator@earist.edu.ph',
    password: 'password123',
    role: 'evaluator',
    name: 'Prof. Noel Carpio',
    college: 'CIT',
  },
  {
    email: 'student@earist.edu.ph',
    password: 'password123',
    role: 'student',
    name: 'Juan Dela Cruz',
    college: 'CIT',
  },
];

export async function seedOneUserPerRole() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
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
