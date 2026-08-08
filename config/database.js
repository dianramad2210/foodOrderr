'use strict';
require('dotenv').config();

// Eksplisit load mysql2 agar Vercel tidak gagal resolve dependency
require('mysql2');

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: isProduction ? false : (msg) => logger.debug(msg),
    dialectOptions: isProduction ? {
      ssl: { rejectUnauthorized: true }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

module.exports = sequelize;
