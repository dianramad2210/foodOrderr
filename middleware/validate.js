'use strict';

const { validationResult } = require('express-validator');
const { validationError } = require('../utils/response');

/**
 * Middleware untuk menangani hasil validasi express-validator.
 * Selalu dipanggil setelah array validator rules.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationError(res, errors.array().map(e => ({
      field: e.path,
      message: e.msg
    })));
  }
  next();
};

module.exports = { validate };
