/* ========================================
   PORTFOLIO BACKEND — Main Server
   Express.js + SQLite + JWT Auth
   ======================================== */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { seedDatabase } = require('./backend/models/database');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- SECURITY ---------- */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/* ---------- RATE LIMITING ---------- */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Juda ko\'p so\'rov yuborildi. Iltimos keyinroq qayta urinib ko\'ring.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for contact form
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Xabar yuborish limiti tugadi. Iltimos 1 soatdan keyin qayta urinib ko\'ring.'
  }
});

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin qayta urinib ko\'ring.'
  }
});

/* ---------- MIDDLEWARE ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ---------- STATIC FILES ---------- */
// Serve the frontend
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

/* ---------- API ROUTES ---------- */
// Auth routes
app.use('/api/auth', authLimiter, require('./backend/routes/auth'));

// Public API routes
app.use('/api', apiLimiter, require('./backend/routes/public'));

// Apply contact limiter specifically
app.use('/api/contacts', contactLimiter);

// Admin API routes (JWT protected)
app.use('/api/admin', apiLimiter, require('./backend/routes/admin'));

/* ---------- API HEALTH CHECK ---------- */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server ishlayapti ✅',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ---------- ADMIN PANEL PAGE ---------- */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

/* ---------- SPA FALLBACK ---------- */
app.get('{*path}', (req, res) => {
  // If request is for API, return 404
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ---------- ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fayl hajmi juda katta. Maksimum 5MB ruxsat etiladi.'
    });
  }

  if (err.message && err.message.includes('rasm fayllari')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Server xatosi yuz berdi'
      : err.message || 'Server xatosi'
  });
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  // Seed database with default data
  seedDatabase();

  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🚀 Portfolio Backend Server          ║
  ║                                          ║
  ║  🌐 Frontend:  http://localhost:${PORT}      ║
  ║  📡 API:       http://localhost:${PORT}/api  ║
  ║  🔧 Admin:     http://localhost:${PORT}/admin║
  ║  💚 Health:    http://localhost:${PORT}/api/health║
  ║                                          ║
  ║  📊 Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
