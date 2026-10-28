import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let dbInfo = { database: null, serverVersion: null };

/**
 * Get or initialize the reusable PostgreSQL connection pool.
 */
export const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      // Gracefully handle idle sockets closed by Neon serverless proxy
      console.warn('[Database] Idle client closed by Neon serverless proxy:', err.message);
      isConnected = false;
    });
  }

  return pool;
};

/**
 * Connect to Neon PostgreSQL and verify connectivity with a startup test query.
 */
export const connectDatabase = async () => {
  const currentPool = getPool();

  try {
    const client = await currentPool.connect();
    try {
      const res = await client.query('SELECT NOW() as current_time, current_database() as db, version() as version');
      isConnected = true;
      dbInfo = {
        database: res.rows[0].db,
        serverVersion: res.rows[0].version,
        connectedAt: res.rows[0].current_time,
      };

      console.log(`[Database] Neon PostgreSQL connected successfully to database: ${res.rows[0].db}`);
      return currentPool;
    } finally {
      client.release();
    }
  } catch (error) {
    isConnected = false;
    console.error(`[Database] Neon PostgreSQL connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Execute a parameterized SQL query using the pool with automatic transient retry for Neon serverless resets.
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param {Array} [params] - Query parameter values
 */
export const query = async (text, params) => {
  const currentPool = getPool();
  try {
    return await currentPool.query(text, params);
  } catch (err) {
    // Neon serverless proxy drops idle TCP sockets (read ECONNRESET, Connection terminated unexpectedly, etc.)
    const isTransientError =
      err.code === 'ECONNRESET' ||
      err.code === 'EPIPE' ||
      err.code === '57P01' || // admin_shutdown
      err.code === '08006' || // connection_failure
      err.code === '08001' || // unable_to_establish_sqlconnection
      err.message?.includes('ECONNRESET') ||
      err.message?.includes('Connection terminated') ||
      err.message?.includes('socket has been ended');

    if (isTransientError) {
      console.warn(`[Database] Transient connection reset detected (${err.message}). Retrying query on new socket...`);
      return await currentPool.query(text, params);
    }
    throw err;
  }
};

/**
 * Returns current health status of the database connection by executing a live ping.
 */
export const getDatabaseStatus = async () => {
  if (!pool) {
    return {
      status: 'disconnected',
      connected: false,
      database: null,
      error: 'Database pool not initialized',
    };
  }

  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as current_time');
    const latencyMs = Date.now() - start;

    return {
      status: 'connected',
      connected: true,
      database: dbInfo.database || 'neondb',
      latencyMs,
      serverTime: res.rows[0].current_time,
    };
  } catch (error) {
    isConnected = false;
    return {
      status: 'error',
      connected: false,
      database: dbInfo.database || null,
      error: error.message,
    };
  }
};

/**
 * Gracefully close the PostgreSQL connection pool.
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    isConnected = false;
    pool = null;
    console.log('[Database] Neon PostgreSQL connection pool closed');
  }
};

export default {
  getPool,
  connectDatabase,
  query,
  getDatabaseStatus,
  closeDatabase,
};
