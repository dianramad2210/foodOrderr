'use strict';

const { v4: uuidv4 } = require('uuid');
const { sequelize, Order, OrderItem, Payment, Cart, CartItem, Food, User } = require('../models');
const { logActivity } = require('../services/activityLogService');
const { ACTIVITY_TYPES, ORDER_STATUS, ORDER_STATUS_TRANSITIONS, PAYMENT_STATUS } = require('../config/constants');
const { success, error, notFound, forbidden, unauthorized } = require('../utils/response');

/**
 * POST /api/orders/checkout
 * Total dihitung di server dari harga database, BUKAN dari request client
 */
const checkout = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { delivery_address, notes, payment_method } = req.body;
    const userId = req.session.userId;

    // Ambil cart user
    const cart = await Cart.findOne({
      where: { user_id: userId },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{ model: Food, as: 'food' }]
      }],
      transaction: t
    });

    if (!cart || !cart.items.length) {
      await t.rollback();
      return res.status(400).json({ status: 'error', message: 'Keranjang kosong' });
    }

    // Validasi stok dan hitung total DI SERVER
    let totalAmount = 0;
    const itemsToCreate = [];

    for (const cartItem of cart.items) {
      const food = cartItem.food;
      if (!food || !food.is_available) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Makanan "${food?.name || 'Unknown'}" tidak tersedia`
        });
      }
      if (food.stock < cartItem.quantity) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Stok "${food.name}" tidak mencukupi. Tersedia: ${food.stock}`
        });
      }

      // Harga diambil dari database saat checkout — BUKAN dari cart atau client
      const unitPrice = parseFloat(food.price);
      const subtotal = unitPrice * cartItem.quantity;
      totalAmount += subtotal;

      itemsToCreate.push({
        food_id: food.id,
        food_name: food.name, // snapshot nama
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        subtotal
      });

      // Kurangi stok
      await food.update({ stock: food.stock - cartItem.quantity }, { transaction: t });
    }

    // Buat order
    const order = await Order.create({
      order_number: `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`,
      user_id: userId,
      status: ORDER_STATUS.PENDING,
      total_amount: totalAmount, // Server-calculated
      delivery_address,
      notes
    }, { transaction: t });

    // Buat order items
    for (const item of itemsToCreate) {
      await OrderItem.create({ order_id: order.id, ...item }, { transaction: t });
    }

    // Buat payment record
    const payment = await Payment.create({
      order_id: order.id,
      payment_method,
      amount: totalAmount, // Sama dengan total order
      status: PAYMENT_STATUS.PENDING,
      transaction_ref: `TXN-${uuidv4().toUpperCase()}`
    }, { transaction: t });

    // Kosongkan cart
    await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });

    await t.commit();

    await logActivity(req, ACTIVITY_TYPES.ORDER_CREATED,
      `Order dibuat: ${order.order_number}`,
      { orderId: order.id, totalAmount }
    );

    return success(res, { order, payment }, 'Pesanan berhasil dibuat', 201);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * POST /api/orders/:id/pay — Simulasi pembayaran
 * Validasi: order milik user ini, status masih pending, belum dibayar
 */
const simulatePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // IDOR check: order harus milik user yang login
    const order = await Order.findOne({
      where: { id, user_id: userId },
      include: [{ model: Payment, as: 'payment' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return notFound(res, 'Pesanan tidak ditemukan');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      await t.rollback();
      return res.status(400).json({ status: 'error', message: 'Pesanan tidak dalam status pending' });
    }

    if (order.payment && order.payment.status === PAYMENT_STATUS.PAID) {
      await t.rollback();
      return res.status(409).json({ status: 'error', message: 'Pesanan sudah dibayar' });
    }

    // Simulasi payment: selalu berhasil di demo
    await order.payment.update({
      status: PAYMENT_STATUS.PAID,
      paid_at: new Date()
    }, { transaction: t });

    await order.update({ status: ORDER_STATUS.PROCESSING }, { transaction: t });

    await t.commit();

    await logActivity(req, ACTIVITY_TYPES.PAYMENT_SUCCESS,
      `Pembayaran berhasil untuk order: ${order.order_number}`,
      { orderId: order.id }
    );

    return success(res, { order, payment: order.payment }, 'Pembayaran berhasil');
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * GET /api/orders — Riwayat pesanan milik user yang login (IDOR check)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.session.userId }, // Hanya milik user ini
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment', attributes: ['status', 'payment_method', 'paid_at'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return success(res, orders);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id — Detail pesanan — IDOR check
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const whereClause = { id };
    // Customer hanya bisa lihat pesanannya sendiri
    if (userRole !== 'admin') {
      whereClause.user_id = userId;
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' }
      ]
    });

    if (!order) return notFound(res, 'Pesanan tidak ditemukan');
    return success(res, order);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/orders — Admin: lihat semua pesanan
 */
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment', attributes: ['status', 'payment_method', 'paid_at'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return success(res, orders);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/orders/:id/status — Admin: ubah status pesanan
 * Validasi state machine — tidak bisa loncat status secara sembarangan
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return notFound(res, 'Pesanan tidak ditemukan');

    // Validasi transisi status (state machine)
    const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Tidak dapat mengubah status dari "${order.status}" ke "${status}"`
      });
    }

    const oldStatus = order.status;
    await order.update({ status });

    await logActivity(req, ACTIVITY_TYPES.ORDER_STATUS_CHANGED,
      `Status order ${order.order_number} diubah dari ${oldStatus} ke ${status}`,
      { orderId: order.id, oldStatus, newStatus: status }
    );

    return success(res, order, 'Status pesanan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout, simulatePayment, getMyOrders, getOrderById,
  getAllOrders, updateOrderStatus
};
