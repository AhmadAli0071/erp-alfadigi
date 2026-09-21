import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leaves.js';
import ticketRoutes from './routes/tickets.js';
import notificationRoutes from './routes/notifications.js';
import leaveTypeRoutes from './routes/leaveTypes.js';
import settingsRoutes from './routes/settings.js';
import reportRoutes from './routes/reports.js';
import { startAutoAbsentJob } from './jobs/autoAbsent.js';

const app = express();

// Serve the built React app (client/dist) when it exists — single-port deployment.
const clientDist = path.resolve(process.cwd(), process.env.CLIENT_DIST || '../client/dist');
const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));
if (hasClientBuild) {
  app.use(express.static(clientDist));
}

// Middleware
app.use(cors({
  origin: (process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173']),
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

// 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// SPA fallback — any non-API GET serves the React app (client-side routing)
if (hasClientBuild) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler — ensures JSON responses instead of HTML error pages
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// MongoDB connection + server start
const start = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ MongoDB connected');

    startAutoAbsentJob();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📋 Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();
