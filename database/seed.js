'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Category, Food } = require('../models');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    logger.info('Koneksi database OK, mulai seeding...');

    // ── 1. Admin default ──────────────────────────────────
    // TIDAK perlu manual bcrypt.hash — hook beforeCreate di model User sudah handle
    let adminCreated = false;
    let admin = await User.findOne({ where: { email: 'admin@foodorder.com' } });
    if (!admin) {
      admin = await User.create({
        name: 'Administrator',
        email: 'admin@foodorder.com',
        password: 'Admin@12345!',   // plain — akan di-hash oleh hook
        role: 'admin',
        phone: '081200000000',
        is_active: true
      });
      adminCreated = true;
    }
    logger.info(adminCreated ? '✅ Admin dibuat' : '⏭ Admin sudah ada');

    // ── 2. Customer demo ──────────────────────────────────
    let custCreated = false;
    let customer = await User.findOne({ where: { email: 'pelanggan@foodorder.com' } });
    if (!customer) {
      customer = await User.create({
        name: 'Pelanggan Demo',
        email: 'pelanggan@foodorder.com',
        password: 'Customer@12345!',  // plain — akan di-hash oleh hook
        role: 'customer',
        phone: '081211111111',
        address: 'Jl. Contoh No. 1, Jakarta',
        is_active: true
      });
      custCreated = true;
    }
    logger.info(custCreated ? '✅ Customer demo dibuat' : '⏭ Customer demo sudah ada');

    // ── 3. Kategori ───────────────────────────────────────
    const categories = [
      { name: 'Makanan Utama', description: 'Hidangan utama seperti nasi, mie, dan sejenisnya' },
      { name: 'Makanan Ringan', description: 'Camilan dan snack' },
      { name: 'Minuman', description: 'Berbagai jenis minuman' },
      { name: 'Dessert', description: 'Makanan penutup dan hidangan manis' },
      { name: 'Paket Hemat', description: 'Paket bundling dengan harga terjangkau' }
    ];

    const catMap = {};
    for (const c of categories) {
      const [cat, created] = await Category.findOrCreate({ where: { name: c.name }, defaults: c });
      catMap[c.name] = cat.id;
      logger.info(created ? `✅ Kategori "${c.name}" dibuat` : `⏭ Kategori "${c.name}" sudah ada`);
    }

    // ── 4. Menu Makanan ───────────────────────────────────
    const foods = [
      // Makanan Utama
      { category: 'Makanan Utama', name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur, ayam, dan sayuran segar', price: 25000, stock: 50, image_url: '/placeholder/320/200?text=Nasi+Goreng' },
      { category: 'Makanan Utama', name: 'Mie Goreng Jawa', description: 'Mie goreng dengan bumbu Jawa yang gurih dan pedas', price: 22000, stock: 40, image_url: '/placeholder/320/200?text=Mie+Goreng' },
      { category: 'Makanan Utama', name: 'Ayam Bakar Madu', description: 'Ayam bakar dengan olesan madu dan bumbu rempah', price: 35000, stock: 30, image_url: '/placeholder/320/200?text=Ayam+Bakar' },
      { category: 'Makanan Utama', name: 'Soto Ayam', description: 'Soto ayam dengan kuah bening, bihun, dan pelengkap', price: 20000, stock: 35, image_url: '/placeholder/320/200?text=Soto+Ayam' },
      { category: 'Makanan Utama', name: 'Gado-Gado', description: 'Sayuran rebus dengan saus kacang khas Indonesia', price: 18000, stock: 25, image_url: '/placeholder/320/200?text=Gado-Gado' },
      { category: 'Makanan Utama', name: 'Rendang Sapi', description: 'Rendang sapi dengan bumbu rempah Minangkabau yang kaya', price: 45000, stock: 20, image_url: '/placeholder/320/200?text=Rendang' },

      // Makanan Ringan
      { category: 'Makanan Ringan', name: 'Pisang Goreng Crispy', description: 'Pisang goreng dengan tepung crispy dan keju parut', price: 12000, stock: 60, image_url: '/placeholder/320/200?text=Pisang+Goreng' },
      { category: 'Makanan Ringan', name: 'Tahu Sumedang', description: 'Tahu goreng khas Sumedang, garing di luar lembut di dalam', price: 10000, stock: 80, image_url: '/placeholder/320/200?text=Tahu+Sumedang' },
      { category: 'Makanan Ringan', name: 'Martabak Mini', description: 'Martabak telur mini dengan isian sayuran dan daging', price: 15000, stock: 40, image_url: '/placeholder/320/200?text=Martabak' },

      // Minuman
      { category: 'Minuman', name: 'Es Teh Manis', description: 'Teh manis dingin segar', price: 8000, stock: 100, image_url: '/placeholder/320/200?text=Es+Teh' },
      { category: 'Minuman', name: 'Jus Alpukat', description: 'Jus alpukat segar dengan susu kental manis', price: 18000, stock: 50, image_url: '/placeholder/320/200?text=Jus+Alpukat' },
      { category: 'Minuman', name: 'Es Jeruk Peras', description: 'Jeruk peras segar tanpa pengawet', price: 12000, stock: 60, image_url: '/placeholder/320/200?text=Es+Jeruk' },
      { category: 'Minuman', name: 'Kopi Susu', description: 'Kopi robusta dengan susu segar, bisa panas atau dingin', price: 15000, stock: 70, image_url: '/placeholder/320/200?text=Kopi+Susu' },

      // Dessert
      { category: 'Dessert', name: 'Es Campur', description: 'Es campur dengan kolang-kaling, cincau, dan sirup', price: 15000, stock: 40, image_url: '/placeholder/320/200?text=Es+Campur' },
      { category: 'Dessert', name: 'Klepon', description: 'Kue klepon beras ketan dengan isian gula merah', price: 10000, stock: 30, image_url: '/placeholder/320/200?text=Klepon' },

      // Paket Hemat
      { category: 'Paket Hemat', name: 'Paket Nasi + Ayam + Minum', description: 'Nasi goreng + Ayam bakar + Es teh manis. Hemat 20%!', price: 48000, stock: 25, image_url: '/placeholder/320/200?text=Paket+Hemat' },
      { category: 'Paket Hemat', name: 'Paket Mie + Minum', description: 'Mie goreng Jawa + Es jeruk peras. Hemat 15%!', price: 28000, stock: 30, image_url: '/placeholder/320/200?text=Paket+Mie' }
    ];

    for (const f of foods) {
      const [food, created] = await Food.findOrCreate({
        where: { name: f.name, category_id: catMap[f.category] },
        defaults: {
          category_id: catMap[f.category],
          name: f.name,
          description: f.description,
          price: f.price,
          stock: f.stock,
          image_url: f.image_url || null,
          is_available: true
        }
      });
      logger.info(created ? `✅ Makanan "${f.name}" dibuat` : `⏭ Makanan "${f.name}" sudah ada`);
    }

    logger.info('\n========================================');
    logger.info('✅ SEEDING SELESAI!');
    logger.info('========================================');
    logger.info('Akun Admin   : admin@foodorder.com / Admin@12345!');
    logger.info('Akun Customer: pelanggan@foodorder.com / Customer@12345!');
    logger.info('========================================\n');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding gagal:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();
