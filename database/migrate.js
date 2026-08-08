'use strict';

require('dotenv').config();
const { sequelize } = require('../models');
const logger = require('../utils/logger');

const migrate = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Koneksi database berhasil');

    // Sync semua model — buat tabel jika belum ada
    await sequelize.sync({ force: false, alter: true });
    logger.info('Migrasi database selesai — semua tabel berhasil dibuat/diperbarui');
    process.exit(0);
  } catch (err) {
    logger.error('Migrasi gagal:', err.message);
    process.exit(1);
  }
};

migrate();
