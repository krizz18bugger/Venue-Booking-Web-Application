import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes     from './routes/auth.js';
import ownerRoutes    from './routes/owner.js';
import adminRoutes    from './routes/admin.js';
import customerRoutes from './routes/customer.js';
import reviewRoutes   from './routes/reviews.js';
import disputeRoutes  from './routes/disputes.js';
import sharedRoutes   from './routes/shared.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL : [/^http:\/\/localhost:\d+$/],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/owner',   ownerRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api',         customerRoutes);   // /api/venues, /api/users/profile, /api/customer/*
app.use('/api',         reviewRoutes);     // /api/venues/:id/reviews
app.use('/api',         disputeRoutes);    // /api/disputes
app.use('/api',         sharedRoutes);     // /api/notifications/mark-all-read, /api/halls/:id/reviews (legacy)

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Venue Booking API is running 🚀', timestamp: new Date() });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API base: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
