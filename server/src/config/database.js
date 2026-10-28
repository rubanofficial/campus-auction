import mongoose from 'mongoose';

/**
 * Connect to MongoDB database using Mongoose
 * Reads MONGODB_URI from environment variables and fails clearly if missing.
 * Connects securely without logging credentials or connection strings.
 */
export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'campus-auction',
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Returns the human-readable database connection state
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export const getDatabaseStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: stateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
  };
};
