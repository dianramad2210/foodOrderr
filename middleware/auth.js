'use strict';

const { response } = require('../utils/response');
const { unauthorized, forbidden } = require('../utils/response');
const { logActivity } = require('../services/activityLogService');
const { ACTIVITY_TYPES, ROLES } = require('../config/constants');

/**
 * Middleware autentikasi — memastikan user sudah login
 */
const authenticate = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return unauthorized(res);
  }
  next();
};

/**
 * Middleware otorisasi berbasis role (RBAC)
 * @param {...string} allowedRoles - role yang diizinkan
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return unauthorized(res);
    }

    if (!allowedRoles.includes(req.session.userRole)) {
      // Catat percobaan akses tanpa izin
      await logActivity(req, ACTIVITY_TYPES.ACCESS_DENIED,
        `Percobaan akses ke ${req.method} ${req.originalUrl} oleh role ${req.session.userRole}`,
        { requiredRoles: allowedRoles, actualRole: req.session.userRole }
      );
      return forbidden(res);
    }
    next();
  };
};

/**
 * Middleware hanya untuk admin
 */
const adminOnly = authorize(ROLES.ADMIN);

/**
 * Middleware hanya untuk customer
 */
const customerOnly = authorize(ROLES.CUSTOMER);

module.exports = { authenticate, authorize, adminOnly, customerOnly };
