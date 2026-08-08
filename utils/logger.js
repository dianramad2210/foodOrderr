'use strict';
require('dotenv').config();

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Pastikan folder logs ada (skip di Vercel/serverless environment)
const logDir = process.env.LOG_DIR || './logs';
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isServerless && !fs.existsSync(logDir)) {
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

const transports = [
  // Log ke console selalu (wajib di Vercel)
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat)
  })
];

// Tambah file transports hanya jika bukan serverless
if (!isServerless) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 10
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports
});

module.exports = logger;
