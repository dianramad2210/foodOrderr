'use strict';

// Index model — definisikan semua asosiasi di satu tempat
const sequelize = require('../config/database');

const User = require('./User');
const Category = require('./Category');
const Food = require('./Food');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const ActivityLog = require('./ActivityLog');

// User — Cart (1:1)
User.hasOne(Cart, { foreignKey: 'user_id', as: 'cart', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Cart — CartItem (1:N)
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

// Food — CartItem (1:N)
Food.hasMany(CartItem, { foreignKey: 'food_id', as: 'cartItems' });
CartItem.belongsTo(Food, { foreignKey: 'food_id', as: 'food' });

// Category — Food (1:N)
Category.hasMany(Food, { foreignKey: 'category_id', as: 'foods' });
Food.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User — Order (1:N)
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order — OrderItem (1:N)
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Food — OrderItem (1:N)
Food.hasMany(OrderItem, { foreignKey: 'food_id', as: 'orderItems' });
OrderItem.belongsTo(Food, { foreignKey: 'food_id', as: 'food' });

// Order — Payment (1:1)
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User — ActivityLog (1:N)
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'logs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Category,
  Food,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  ActivityLog
};
