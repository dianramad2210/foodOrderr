'use strict';

const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Global error handler — mencegah leakage informasi internal ke client.
 * Selalu harus menjadi middleware terakhir di Express.
 */
const errorHandler = (err, req, res, next) => {
  // Catat error lengkap di log server
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.session?.userId
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      status: 'error',
      message: 'Data tidak valid',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'error',
      message: 'Data sudah ada'
    });
  }

  // Kirim response generik — TIDAK menyertakan stack trace atau detail internal
  return error(res, 'Terjadi kesalahan pada server', 500, err);
};

/**
 * Handler untuk route yang tidak ditemukan
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    status: 'error',
    message: 'Endpoint tidak ditemukan'
  });
};

module.exports = { errorHandler, notFoundHandler };
