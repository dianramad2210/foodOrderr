'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator, changePasswordValidator } = require('../validators/authValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// Registrasi
router.post('/register', registerValidator, validate, authController.register);

// Login
router.post('/login', loginValidator, validate, authController.login);

// Logout (butuh login)
router.post('/logout', authenticate, authController.logout);

// Info user saat ini
router.get('/me', authenticate, authController.me);

// Update profil
router.put('/profile', authenticate, updateProfileValidator, validate, authController.updateProfile);

// Ganti password
router.put('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
