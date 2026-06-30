const mongoose = require('mongoose');
const dns = require('dns');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    console.error('❌ MONGO_URI not found in environment variables');
    throw new Error('MONGO_URI not configured');
  }

  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB connected → ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`❌ MongoDB connection failed → ${error.message}`);

        if (error.message.includes('querySrv ECONNREFUSED')) {
          console.error(
            '💡 Tip: Use the "Standard" connection string from Atlas (Connect → Drivers → Standard) in MONGO_URI.'
          );
        }

        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
