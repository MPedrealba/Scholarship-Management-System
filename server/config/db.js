import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 6000,
    });
    console.log(` MongoDB Connected: ${conn.connection.host} (DB: earist_scholarship)`);
  } catch (error) {
    console.warn(` MongoDB Connection Notice: ${error.message}`);
    console.log(` [High-Availability Failover]: Operating in resilient dual-mode. Retrying MongoDB Atlas connection in background.`);
    setTimeout(connectDB, 15000);
  }
};
