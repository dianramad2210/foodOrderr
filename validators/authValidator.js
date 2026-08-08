'use strict';

const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh berisi huruf dan spasi'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail()
    .isLength({ max: 150 })
    .withMessage('Email terlalu panjang'),

  body('password')
    .isLength({ min: 8, max: 72 }) // bcrypt max 72 chars
    .withMessage('Password harus antara 8-72 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{8,20}$/)
    .withMessage('Format nomor telepon tidak valid')
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password tidak boleh kosong')
    .isLength({ max: 72 })
    .withMessage('Password terlalu panjang')
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Nama hanya boleh berisi huruf dan spasi'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{8,20}$/)
    .withMessage('Format nomor telepon tidak valid'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Alamat terlalu panjang')
];

const changePasswordValidator = [
  body('current_password')
    .notEmpty()
    .withMessage('Password saat ini tidak boleh kosong'),

  body('new_password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password baru harus antara 8-72 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'),

  body('confirm_password')
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage('Konfirmasi password tidak cocok')
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator
};
