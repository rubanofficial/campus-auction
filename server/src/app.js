import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { getPool } from './config/database.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import auctionRoutes from './routes/auction.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy in production (e.g., Render, Railway, Vercel, Nginx)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security headers with Helmet
app.use(helmet());

// CORS configuration supporting credentials from allowed client origin
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

// JSON body parsing middleware
app.use(express.json());

// Neon PostgreSQL-backed session store configuration
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool: getPool(),
  tableName: 'session',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
});

// Secure server-side sessions
app.use(
  session({
    name: 'campus_auction_sid',
    secret: process.env.SESSION_SECRET || 'dev_fallback_secret_campus_auction_key_123456789',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  })
);

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

export default app;
