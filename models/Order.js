'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ORDER_STATUS } = require('../config/constants');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM(
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED
    ),
    allowNull: false,
    defaultValue: ORDER_STATUS.PENDING
  },
  // Total dihitung di server saat checkout — TIDAK dari client
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, { tableName: 'orders' });

module.exports = Order;
