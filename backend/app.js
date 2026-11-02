const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

// Enable trust proxy for reverse proxies (Render, Vercel, Cloudflare)
app.set('trust proxy', 1);

// Configure CORS for production (Vercel frontend) and local development
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:5001',
].flatMap((o) => (o ? o.split(',').map((s) => s.trim()) : []));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /localhost(:\d+)?$/.test(origin) ||
        /127\.0\.0\.1(:\d+)?$/.test(origin);

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Backend root status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EduPre Plus Backend API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
    time: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EduPre Plus API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/interventions', require('./routes/interventionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve frontend static build if dist folder exists (e.g. monolithic fallback)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
