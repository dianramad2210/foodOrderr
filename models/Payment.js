'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Satu order hanya boleh punya satu payment sukses
    references: { model: 'orders', key: 'id' }
  },
  payment_method: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
    allowNull: false,
    defaultValue: PAYMENT_STATUS.PENDING
  },
  // Referensi transaksi simulasi
  transaction_ref: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, { tableName: 'payments' });

module.exports = Payment;
