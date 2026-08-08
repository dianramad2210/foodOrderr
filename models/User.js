'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const { ROLES } = require('../config/constants');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(ROLES.ADMIN, ROLES.CUSTOMER),
    allowNull: false,
    defaultValue: ROLES.CUSTOMER
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  hooks: {
    // Hash password sebelum menyimpan — TIDAK pernah simpan plain text
    beforeCreate: async (user) => {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      user.password = await bcrypt.hash(user.password, rounds);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, rounds);
      }
    }
  }
});

/**
 * Verifikasi password — menggunakan bcrypt.compare (timing-safe)
 */
User.prototype.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Kembalikan data user tanpa field sensitif
 */
User.prototype.toSafeJSON = function () {
  const obj = this.toJSON();
  delete obj.password;
  delete obj.failed_login_attempts;
  delete obj.locked_until;
  return obj;
};

module.exports = User;
