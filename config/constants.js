'use strict';

module.exports = {
  // Peran pengguna
  ROLES: {
    ADMIN: 'admin',
    CUSTOMER: 'customer'
  },

  // Status pesanan
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Urutan status pesanan yang valid (state machine)
  ORDER_STATUS_TRANSITIONS: {
    pending: ['processing', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  },

  // Status pembayaran
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Metode pembayaran (simulasi)
  PAYMENT_METHODS: {
    CREDIT_CARD: 'credit_card',
    BANK_TRANSFER: 'bank_transfer',
    E_WALLET: 'e_wallet',
    CASH: 'cash'
  },

  // Jenis aktivitas untuk log
  ACTIVITY_TYPES: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    PROFILE_UPDATE: 'PROFILE_UPDATE',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    ROLE_CHANGE: 'ROLE_CHANGE',
    ACCESS_DENIED: 'ACCESS_DENIED',
    FOOD_CREATED: 'FOOD_CREATED',
    FOOD_UPDATED: 'FOOD_UPDATED',
    FOOD_DELETED: 'FOOD_DELETED',
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
    PAYMENT_ATTEMPTED: 'PAYMENT_ATTEMPTED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
  }
};
