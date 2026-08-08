'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'carts', key: 'id' }
  },
  food_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'foods', key: 'id' }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1, max: 100 }
  },
  // Harga disimpan saat ditambahkan ke keranjang (snapshot)
  price_at_add: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, { tableName: 'cart_items' });

module.exports = CartItem;
