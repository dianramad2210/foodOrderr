'use strict';

const { ActivityLog, User } = require('../models');
const { success } = require('../utils/response');

/**
 * GET /api/admin/logs — Admin: lihat security log
 */
const getLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      order: [['created_at', 'DESC']],
      limit: 500
    });
    return success(res, logs);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
