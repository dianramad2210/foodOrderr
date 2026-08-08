'use strict';

const { body, param, query } = require('express-validator');

const createFoodValidator = [
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Category ID tidak valid'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Nama makanan harus antara 2-150 karakter'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Deskripsi terlalu panjang'),

  body('price')
    .isFloat({ min: 0, max: 100000000 })
    .withMessage('Harga tidak valid (min: 0, max: 100.000.000)'),

  body('stock')
    .isInt({ min: 0, max: 99999 })
    .withMessage('Stok tidak valid'),

  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available harus boolean')
];

const updateFoodValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID tidak valid'),

  ...createFoodValidator.map(v => {
    // Jadikan semua field optional untuk update
    return v.optional ? v : v;
  })
];

const foodIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID makanan tidak valid')
];

const addToCartValidator = [
  body('food_id')
    .isInt({ min: 1 })
    .withMessage('Food ID tidak valid'),

  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Jumlah harus antara 1-100')
];

const checkoutValidator = [
  body('delivery_address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Alamat pengiriman harus antara 10-500 karakter'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Catatan terlalu panjang'),

  body('payment_method')
    .isIn(['credit_card', 'bank_transfer', 'e_wallet', 'cash'])
    .withMessage('Metode pembayaran tidak valid')
];

const updateOrderStatusValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID pesanan tidak valid'),

  body('status')
    .isIn(['processing', 'completed', 'cancelled'])
    .withMessage('Status tidak valid')
];

module.exports = {
  createFoodValidator,
  updateFoodValidator,
  foodIdValidator,
  addToCartValidator,
  checkoutValidator,
  updateOrderStatusValidator
};
