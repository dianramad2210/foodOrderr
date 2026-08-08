'use strict';
require('dotenv').config();

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Pastikan folder logs ada
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format log kustom — TIDAK menyertakan data sensitif
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  // Hapus field sensitif dari meta sebelum logging
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.secret;
  delete safeMeta.credit_card;

  const metaStr = Object.keys(safeMeta).length ? ` ${JSON.stringify(safeMeta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Log semua level ke file combined
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Log error ke file terpisah
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    }),
    // Log security events ke file terpisah
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

// Tampilkan log ke console saat development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat)
  }));
}

module.exports = logger;
