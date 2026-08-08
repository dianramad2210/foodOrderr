'use strict';

const { Category } = require('../models');
const { success, notFound } = require('../utils/response');
const { body, param } = require('express-validator');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    return success(res, categories);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    return success(res, category, 'Kategori berhasil dibuat', 201);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return notFound(res, 'Kategori tidak ditemukan');
    const { name, description, is_active } = req.body;
    await cat.update({ ...(name && { name }), ...(description !== undefined && { description }), ...(is_active !== undefined && { is_active }) });
    return success(res, cat, 'Kategori berhasil diperbarui');
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return notFound(res, 'Kategori tidak ditemukan');
    await cat.update({ is_active: false });
    return success(res, null, 'Kategori berhasil dihapus');
  } catch (err) { next(err); }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
