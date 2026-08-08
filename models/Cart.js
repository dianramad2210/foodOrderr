'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Satu user hanya punya satu cart aktif
    references: { model: 'users', key: 'id' }
  }
}, { tableName: 'carts' });

module.exports = Cart;
