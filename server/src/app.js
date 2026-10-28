import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Security headers with Helmet
app.use(helmet());

// CORS configuration based on CLIENT_URL environment variable
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

// JSON body parsing middleware
app.use(express.json());

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

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
