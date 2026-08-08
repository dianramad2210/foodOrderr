'use strict';

const logger = require('../utils/logger');
const { ACTIVITY_TYPES } = require('../config/constants');
const { ActivityLog } = require('../models');

/**
 * Service untuk mencatat aktivitas keamanan ke database DAN file log.
 * Dipanggil dari controller/middleware untuk setiap aktivitas penting.
 */
const logActivity = async (req, activityType, description, metadata = null) => {
  try {
    const userId = req.session?.userId || null;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers?.['user-agent'] || 'unknown';

    // Simpan ke database
    await ActivityLog.create({
      user_id: userId,
      activity_type: activityType,
      description,
      ip_address: ip,
      user_agent: userAgent,
      metadata
    });

    // Juga catat ke file log winston untuk monitoring
    const logMessage = `[${activityType}] ${description} | user_id=${userId} | ip=${ip}`;

    // Aktivitas berisiko tinggi di level warn
    const highRiskActivities = [
      ACTIVITY_TYPES.LOGIN_FAILED,
      ACTIVITY_TYPES.ACCESS_DENIED,
      ACTIVITY_TYPES.ROLE_CHANGE,
      ACTIVITY_TYPES.SUSPICIOUS_ACTIVITY,
      ACTIVITY_TYPES.PAYMENT_FAILED
    ];

    if (highRiskActivities.includes(activityType)) {
      logger.warn(logMessage, { activityType, userId, ip });
    } else {
      logger.info(logMessage, { activityType, userId, ip });
    }
  } catch (err) {
    // Logging error tidak boleh crash aplikasi
    logger.error('Gagal mencatat activity log:', err.message);
  }
};

module.exports = { logActivity };
