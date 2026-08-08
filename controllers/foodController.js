'use strict';

const { Food, Category } = require('../models');
const { logActivity } = require('../services/activityLogService');
const { ACTIVITY_TYPES } = require('../config/constants');
const { success, error, notFound, forbidden } = require('../utils/response');

/**
 * GET /api/foods — Semua pengguna (termasuk tamu) dapat melihat daftar makanan
 */
const getAllFoods = async (req, res, next) => {
  try {
    const foods = await Food.findAll({
      where: { is_available: true },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    return success(res, foods);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/foods/:id — Detail makanan
 */
const getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findOne({
      where: { id: req.params.id, is_available: true },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });
    if (!food) return notFound(res, 'Makanan tidak ditemukan');
    return success(res, food);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/foods — Admin: lihat semua makanan (termasuk tidak tersedia)
 */
const getAllFoodsAdmin = async (req, res, next) => {
  try {
    const foods = await Food.findAll({
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['id', 'ASC']]
    });
    return success(res, foods);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/foods — Admin: buat makanan baru
 */
const createFood = async (req, res, next) => {
  try {
    const { category_id, name, description, price, stock, image_url, is_available } = req.body;

    // Validasi category ada
    const category = await Category.findByPk(category_id);
    if (!category) return notFound(res, 'Kategori tidak ditemukan');

    const food = await Food.create({
      category_id, name, description,
      price: parseFloat(price),
      stock: parseInt(stock),
      image_url,
      is_available: is_available !== undefined ? is_available : true
    });

    await logActivity(req, ACTIVITY_TYPES.FOOD_CREATED,
      `Makanan dibuat: ${name}`, { foodId: food.id });

    return success(res, food, 'Makanan berhasil dibuat', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/foods/:id — Admin: update makanan
 */
const updateFood = async (req, res, next) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return notFound(res, 'Makanan tidak ditemukan');

    const { category_id, name, description, price, stock, image_url, is_available } = req.body;

    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) return notFound(res, 'Kategori tidak ditemukan');
    }

    await food.update({
      ...(category_id && { category_id }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(image_url !== undefined && { image_url }),
      ...(is_available !== undefined && { is_available })
    });

    await logActivity(req, ACTIVITY_TYPES.FOOD_UPDATED,
      `Makanan diperbarui: ${food.name}`, { foodId: food.id });

    return success(res, food, 'Makanan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/foods/:id — Admin: hapus permanen makanan
 */
const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return notFound(res, 'Makanan tidak ditemukan');

    const foodName = food.name;
    // Hapus permanen dari database
    await food.destroy();

    await logActivity(req, ACTIVITY_TYPES.FOOD_DELETED,
      `Makanan dihapus permanen: ${foodName}`, { foodId: req.params.id });

    return success(res, null, 'Makanan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFoods, getFoodById, getAllFoodsAdmin, createFood, updateFood, deleteFood };
