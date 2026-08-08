'use strict';

const { Cart, CartItem, Food } = require('../models');
const { success, notFound, error } = require('../utils/response');

/**
 * GET /api/cart — Ambil keranjang milik user yang sedang login
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({
      where: { user_id: req.session.userId },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Food,
          as: 'food',
          attributes: ['id', 'name', 'price', 'image_url', 'is_available', 'stock']
        }]
      }]
    });

    // Buat cart jika belum ada
    if (!cart) {
      cart = await Cart.create({ user_id: req.session.userId });
      cart.items = [];
    }

    // Hitung total di server
    const total = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price_at_add) * item.quantity);
    }, 0);

    return success(res, { cart, total });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart/items — Tambah item ke keranjang
 * Harga diambil dari database, BUKAN dari client
 */
const addToCart = async (req, res, next) => {
  try {
    const { food_id, quantity } = req.body;

    // Validasi makanan ada dan tersedia
    const food = await Food.findOne({
      where: { id: food_id, is_available: true }
    });
    if (!food) return notFound(res, 'Makanan tidak ditemukan atau tidak tersedia');

    // Validasi stok
    if (food.stock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Stok tidak cukup. Tersedia: ${food.stock}`
      });
    }

    // Cari atau buat cart
    let [cart] = await Cart.findOrCreate({
      where: { user_id: req.session.userId }
    });

    // Cek apakah item sudah ada di cart
    const existingItem = await CartItem.findOne({
      where: { cart_id: cart.id, food_id }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + parseInt(quantity);
      if (newQty > 100) {
        return res.status(400).json({ status: 'error', message: 'Jumlah item melebihi batas' });
      }
      if (food.stock < newQty) {
        return res.status(400).json({
          status: 'error',
          message: `Stok tidak cukup. Tersedia: ${food.stock}`
        });
      }
      await existingItem.update({ quantity: newQty });
      return success(res, existingItem, 'Item diperbarui');
    }

    // Harga disimpan sebagai snapshot dari database saat ini
    const item = await CartItem.create({
      cart_id: cart.id,
      food_id,
      quantity: parseInt(quantity),
      price_at_add: food.price // Harga dari DB, bukan dari client
    });

    return success(res, item, 'Item ditambahkan ke keranjang', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/cart/items/:itemId — Update jumlah item
 * IDOR prevention: validasi item milik user yang sedang login
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    // Pastikan item milik user yang login (IDOR check)
    const cart = await Cart.findOne({ where: { user_id: req.session.userId } });
    if (!cart) return notFound(res, 'Keranjang tidak ditemukan');

    const item = await CartItem.findOne({
      where: { id: req.params.itemId, cart_id: cart.id } // filter by cart_id = milik user
    });
    if (!item) return notFound(res, 'Item tidak ditemukan');

    if (parseInt(quantity) < 1) {
      await item.destroy();
      return success(res, null, 'Item dihapus dari keranjang');
    }

    await item.update({ quantity: parseInt(quantity) });
    return success(res, item, 'Item diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart/items/:itemId — Hapus item dari keranjang
 * IDOR prevention: validasi kepemilikan cart
 */
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { user_id: req.session.userId } });
    if (!cart) return notFound(res);

    // Pastikan item milik cart user ini
    const item = await CartItem.findOne({
      where: { id: req.params.itemId, cart_id: cart.id }
    });
    if (!item) return notFound(res, 'Item tidak ditemukan');

    await item.destroy();
    return success(res, null, 'Item dihapus');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart — Kosongkan keranjang
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { user_id: req.session.userId } });
    if (cart) {
      await CartItem.destroy({ where: { cart_id: cart.id } });
    }
    return success(res, null, 'Keranjang dikosongkan');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
