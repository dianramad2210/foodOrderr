'use strict';

/**
 * Helper untuk mengirim response API yang konsisten dan aman.
 * TIDAK pernah menyertakan stack trace di production.
 */

const { NODE_ENV } = process.env;

/**
 * Response sukses
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Response error — menyembunyikan detail internal di production
 */
const error = (res, message = 'Terjadi kesalahan', statusCode = 500, err = null) => {
  const response = {
    status: 'error',
    message
  };

  // Hanya tampilkan detail error di development
  if (NODE_ENV === 'development' && err) {
    response.debug = err.message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Response validasi gagal
 */
const validationError = (res, errors) => {
  return res.status(422).json({
    status: 'error',
    message: 'Data tidak valid',
    errors
  });
};

/**
 * Response tidak terautentikasi
 */
const unauthorized = (res, message = 'Anda harus login terlebih dahulu') => {
  return res.status(401).json({ status: 'error', message });
};

/**
 * Response tidak memiliki izin
 */
const forbidden = (res, message = 'Anda tidak memiliki izin untuk melakukan aksi ini') => {
  return res.status(403).json({ status: 'error', message });
};

/**
 * Response tidak ditemukan
 */
const notFound = (res, message = 'Data tidak ditemukan') => {
  return res.status(404).json({ status: 'error', message });
};

module.exports = { success, error, validationError, unauthorized, forbidden, notFound };
