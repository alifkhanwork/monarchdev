const mongoose = require('mongoose');
const dns = require('dns');
const migrateDailyTasks = require('../utils/migrateDailyTasks');

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }

  // Local DNS often fails SRV lookups for Atlas (querySrv ECONNREFUSED).
  // Use Google DNS for mongodb+srv resolution — same fix as svg-crm backend.
  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected → ${conn.connection.host}`);
    await migrateDailyTasks();
  } catch (error) {
    console.error(`❌ MongoDB connection failed → ${error.message}`);

    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error(
        '💡 Tip: Use the "Standard" connection string from Atlas (Connect → Drivers → Standard) in MONGO_URI.'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
