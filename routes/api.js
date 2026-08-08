'use strict';

const express = require('express');
const router = express.Router();

const foodController = require('../controllers/foodController');
const categoryController = require('../controllers/categoryController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const logController = require('../controllers/logController');
const { authenticate, adminOnly, customerOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createFoodValidator, updateFoodValidator, foodIdValidator,
  addToCartValidator, checkoutValidator, updateOrderStatusValidator
} = require('../validators/foodValidator');
const { body, param } = require('express-validator');

// ========== PUBLIC ROUTES ==========
// Daftar dan detail makanan dapat diakses tanpa login
router.get('/foods', foodController.getAllFoods);
router.get('/foods/:id', foodIdValidator, validate, foodController.getFoodById);
router.get('/categories', categoryController.getAllCategories);

// ========== CUSTOMER ROUTES ==========
// Keranjang
router.get('/cart', authenticate, customerOnly, cartController.getCart);
router.post('/cart/items', authenticate, customerOnly, addToCartValidator, validate, cartController.addToCart);
router.put('/cart/items/:itemId', authenticate, customerOnly, [param('itemId').isInt({ min: 1 }), body('quantity').isInt({ min: 0, max: 100 })], validate, cartController.updateCartItem);
router.delete('/cart/items/:itemId', authenticate, customerOnly, [param('itemId').isInt({ min: 1 })], validate, cartController.removeCartItem);
router.delete('/cart', authenticate, customerOnly, cartController.clearCart);

// Order
router.post('/orders/checkout', authenticate, customerOnly, checkoutValidator, validate, orderController.checkout);
router.post('/orders/:id/pay', authenticate, customerOnly, [param('id').isInt({ min: 1 })], validate, orderController.simulatePayment);
router.get('/orders', authenticate, orderController.getMyOrders);
router.get('/orders/:id', authenticate, [param('id').isInt({ min: 1 })], validate, orderController.getOrderById);

// ========== ADMIN ROUTES ==========
// Kelola makanan
router.get('/admin/foods', authenticate, adminOnly, foodController.getAllFoodsAdmin);
router.post('/admin/foods', authenticate, adminOnly, createFoodValidator, validate, foodController.createFood);
router.put('/admin/foods/:id', authenticate, adminOnly, updateFoodValidator, validate, foodController.updateFood);
router.delete('/admin/foods/:id', authenticate, adminOnly, foodIdValidator, validate, foodController.deleteFood);

// Kelola kategori
router.post('/admin/categories', authenticate, adminOnly, [body('name').trim().isLength({ min: 2, max: 100 })], validate, categoryController.createCategory);
router.put('/admin/categories/:id', authenticate, adminOnly, [param('id').isInt({ min: 1 })], validate, categoryController.updateCategory);
router.delete('/admin/categories/:id', authenticate, adminOnly, [param('id').isInt({ min: 1 })], validate, categoryController.deleteCategory);

// Kelola pesanan
router.get('/admin/orders', authenticate, adminOnly, orderController.getAllOrders);
router.put('/admin/orders/:id/status', authenticate, adminOnly, updateOrderStatusValidator, validate, orderController.updateOrderStatus);

// Security logs
router.get('/admin/logs', authenticate, adminOnly, logController.getLogs);

module.exports = router;
