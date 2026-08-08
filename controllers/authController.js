'use strict';

const { User } = require('../models');
const { logActivity } = require('../services/activityLogService');
const { ACTIVITY_TYPES } = require('../config/constants');
const { success, error, unauthorized, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Cek email sudah terdaftar
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    // Role selalu customer saat registrasi — tidak bisa di-set dari client
    const user = await User.create({ name, email, password, phone, role: 'customer' });

    await logActivity(req, ACTIVITY_TYPES.REGISTER,
      `Pengguna baru terdaftar: ${email}`,
      { userId: user.id }
    );

    return success(res, { id: user.id, email: user.email, role: user.role },
      'Registrasi berhasil', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // Cek apakah akun terkunci
    if (user && user.locked_until && user.locked_until > new Date()) {
      await logActivity(req, ACTIVITY_TYPES.LOGIN_FAILED,
        `Login ke akun terkunci: ${email}`);
      return res.status(423).json({
        status: 'error',
        message: 'Akun terkunci sementara. Coba lagi nanti.'
      });
    }

    // Validasi user dan password
    if (!user || !user.is_active || !(await user.verifyPassword(password))) {
      // Increment failed attempts jika user ada
      if (user) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const updateData = { failed_login_attempts: attempts };
        // Kunci akun setelah 5 gagal selama 15 menit
        if (attempts >= 5) {
          updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        }
        await user.update(updateData);
      }

      await logActivity(req, ACTIVITY_TYPES.LOGIN_FAILED,
        `Percobaan login gagal untuk: ${email}`);

      // Pesan error generik — tidak memberi tahu apakah email atau password yang salah
      return unauthorized(res, 'Email atau password tidak valid');
    }

    // Reset failed attempts saat login berhasil
    await user.update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date()
    });

    // Buat session baru (regenerate untuk mencegah session fixation)
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      logActivity(req, ACTIVITY_TYPES.LOGIN_SUCCESS,
        `Login berhasil: ${email}`);

      return success(res, user.toSafeJSON(), 'Login berhasil');
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await logActivity(req, ACTIVITY_TYPES.LOGOUT,
      `Logout: ${req.session.userEmail}`);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('foodorder.sid');
      return success(res, null, 'Logout berhasil');
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return notFound(res, 'User tidak ditemukan');
    return success(res, user.toSafeJSON());
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return notFound(res);

    const { name, phone, address } = req.body;
    // Hanya field yang diizinkan — tidak bisa update role, email, atau password di sini
    await user.update({ name, phone, address });

    await logActivity(req, ACTIVITY_TYPES.PROFILE_UPDATE,
      `Profil diperbarui: ${user.email}`);

    return success(res, user.toSafeJSON(), 'Profil berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return notFound(res);

    const { current_password, new_password } = req.body;

    if (!(await user.verifyPassword(current_password))) {
      await logActivity(req, ACTIVITY_TYPES.LOGIN_FAILED,
        `Percobaan ganti password dengan password lama salah: ${user.email}`);
      return res.status(400).json({ status: 'error', message: 'Password saat ini tidak benar' });
    }

    await user.update({ password: new_password });

    await logActivity(req, ACTIVITY_TYPES.PASSWORD_CHANGE,
      `Password diubah: ${user.email}`);

    // Logout setelah ganti password untuk keamanan
    req.session.destroy(() => {
      res.clearCookie('foodorder.sid');
      return success(res, null, 'Password berhasil diubah. Silakan login kembali.');
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, me, updateProfile, changePassword };
