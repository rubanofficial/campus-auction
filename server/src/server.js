import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDatabase, closeDatabase } from './config/database.js';

const PORT = process.env.PORT || 5000;

/**
 * Initializes Neon PostgreSQL database connection and starts Express HTTP server.
 * Handles startup failures strictly without leaving a misleading running server.
 */
const startServer = async () => {
  try {
    // 1. Connect to Neon PostgreSQL database before accepting HTTP requests
    console.log('[Server] Connecting to Neon PostgreSQL database...');
    await connectDatabase();

    // 2. Start Express HTTP server
    const server = app.listen(PORT, () => {
      console.log(
        `[Server] Campus Auction API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
      );
    });

    // 3. Graceful shutdown handler
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] ${signal} signal received. Closing HTTP server and database pool...`);
      server.close(async () => {
        try {
          await closeDatabase();
          console.log('[Server] Database connection closed. Exiting process.');
          process.exit(0);
        } catch (closeError) {
          console.error(`[Server] Error closing database pool: ${closeError.message}`);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error(`[Server] Critical startup failure: ${error.message}`);
    // Exit immediately to avoid leaving a misleading or non-functional server running
    process.exit(1);
  }
};

startServer();
