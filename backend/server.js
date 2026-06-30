require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const userRoutes = require('./routes/user');
const dailiesRoutes = require('./routes/dailies');
const milestonesRoutes = require('./routes/milestones');
const itemsRoutes = require('./routes/items');
const weeklyRoutes = require('./routes/weekly');
const monthlyRoutes = require('./routes/monthly');

const app = express();
const PORT = process.env.PORT || 5000;

const DB_STATUS = {
  0: { label: 'disconnected', emoji: '🔴' },
  1: { label: 'connected', emoji: '🟢' },
  2: { label: 'connecting', emoji: '🟡' },
  3: { label: 'disconnecting', emoji: '🟠' },
};

connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const db = DB_STATUS[dbState] || { label: 'unknown', emoji: '⚪' };
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'online' : 'degraded',
    message: isHealthy
      ? '⚔️ The System is online — all gateways operational'
      : '⚠️ The System is running, but the database link is unstable',
    system: {
      name: 'The System',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    database: {
      status: db.label,
      emoji: db.emoji,
      host: mongoose.connection.host || null,
    },
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🌌 Welcome, Hunter. The System awaits your command.',
    docs: {
      health: '/api/health',
      player: '/api/user',
      dailies: '/api/dailies',
      milestones: '/api/milestones',
      items: '/api/items',
    },
  });
});

app.use('/api/user', userRoutes);
app.use('/api/dailies', dailiesRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/weekly', weeklyRoutes);
app.use('/api/monthly', monthlyRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: '🚫 Quest not found — this route does not exist in The System',
    path: req.originalUrl,
  });
});

app.use((err, req, res, _next) => {
  console.error('💥 System error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: '💀 Critical System failure — internal server error',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       ⚔️  THE SYSTEM — BACKEND API       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`🚀 Server online     → http://localhost:${PORT}`);
  console.log(`🩺 Health check      → http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment       → ${process.env.NODE_ENV || 'development'}`);
  console.log('📡 Awaiting hunter connection...\n');
});
