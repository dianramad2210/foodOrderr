'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Percayai proxy Vercel
app.set('trust proxy', 1);

// =============================================
// SECURITY HEADERS (Helmet)
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc:      ["'self'", "'unsafe-inline'"],
      scriptSrcAttr:  ["'unsafe-inline'"], // izinkan onclick="..." di HTML
      imgSrc:         ["'self'", 'data:', 'https:', 'https://placehold.co'],
      connectSrc:     ["'self'"]
    }
  },
  // Nonaktifkan HSTS di development (hanya aktif di production dengan HTTPS)
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  // Nonaktifkan X-Frame-Options via meta tag (sudah lewat header)
  frameguard: { action: 'deny' }
}));

// =============================================
// RATE LIMITING
// =============================================
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak request. Coba lagi nanti.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  skipSuccessfulRequests: true,
  message: { status: 'error', message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// =============================================
// CORS
// =============================================
app.use(cors({
  origin: process.env.APP_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// =============================================
// BODY PARSER
// =============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// =============================================
// SESSION — Secure Configuration
// =============================================
app.use(session({
  name: 'foodorder.sid', // Nama cookie yang tidak mengekspos teknologi
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,  // Mencegah akses JavaScript ke cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only di production
    sameSite: 'lax', // Proteksi CSRF
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000
  }
}));

// =============================================
// LOGGING (HTTP Request Log)
// =============================================
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// =============================================
// STATIC FILES
// =============================================
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// ROUTES
// =============================================
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./routes/auth'));
app.use('/placeholder', require('./routes/placeholder'));

// Semua route non-API → serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// ERROR HANDLERS (harus paling akhir)
// =============================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================
// DATABASE & SERVER START
// =============================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Koneksi database berhasil');

    // Sync models — buat tabel jika belum ada
    await sequelize.sync({ alter: false, force: false });
    logger.info('Database sync selesai');

    app.listen(PORT, () => {
      logger.info(`FoodOrder server berjalan di port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Gagal menjalankan server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
