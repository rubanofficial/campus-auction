import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

let pool = null;
let isConnected = false;
let dbInfo = { database: null, serverVersion: null };

/**
 * Check if a database error is transient (e.g. dropped idle TCP socket or Neon compute wake-up)
 */
export const isTransientError = (err) => {
  if (!err) return false;
  const msg = err.message || '';
  return (
    err.code === 'ECONNRESET' ||
    err.code === 'EPIPE' ||
    err.code === 'ETIMEDOUT' ||
    err.code === '57P01' || // admin_shutdown
    err.code === '57P02' || // crash_shutdown
    err.code === '57P03' || // cannot_connect_now
    err.code === '08006' || // connection_failure
    err.code === '08001' || // unable_to_establish_sqlconnection
    err.code === '08003' || // connection_does_not_exist
    err.code === '08004' || // sqlclient_unable_to_establish_sqlconnection
    msg.includes('ECONNRESET') ||
    msg.includes('Connection terminated') ||
    msg.includes('socket has been ended') ||
    msg.includes('server closed the connection') ||
    msg.includes('Connection closed')
  );
};

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
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });

    pool.on('error', (err) => {
      // Gracefully handle idle sockets closed by Neon serverless proxy
      console.warn('[Database] Idle client closed by Neon serverless proxy:', err.message);
      isConnected = false;
    });

    // Wrap pool.query to transparently retry on transient Neon drops (benefits connect-pg-simple and direct callers)
    const originalPoolQuery = pool.query.bind(pool);
    pool.query = async function (text, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = undefined;
      }

      const maxRetries = 3;
      let lastErr;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await originalPoolQuery(text, params);
          if (callback) return callback(null, res);
          return res;
        } catch (err) {
          lastErr = err;
          if (isTransientError(err) && attempt < maxRetries) {
            console.warn(
              `[Database] Transient connection drop (${err.message}) on attempt ${attempt}/${maxRetries}. Retrying in ${attempt * 300}ms...`
            );
            await new Promise((r) => setTimeout(r, attempt * 300));
            continue;
          }
          if (callback) return callback(err);
          throw err;
        }
      }
      if (callback) return callback(lastErr);
      throw lastErr;
    };

    // Wrap pool.connect to transparently retry on transient Neon drops
    const originalPoolConnect = pool.connect.bind(pool);
    pool.connect = async function (callback) {
      const maxRetries = 3;
      let lastErr;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const client = await originalPoolConnect();
          if (callback) return callback(null, client);
          return client;
        } catch (err) {
          lastErr = err;
          if (isTransientError(err) && attempt < maxRetries) {
            console.warn(
              `[Database] Transient drop acquiring connection client (${err.message}). Retrying in ${attempt * 300}ms...`
            );
            await new Promise((r) => setTimeout(r, attempt * 300));
            continue;
          }
          if (callback) return callback(err);
          throw err;
        }
      }
      if (callback) return callback(lastErr);
      throw lastErr;
    };
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
  return await currentPool.query(text, params);
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
