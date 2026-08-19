const mongoose = require('mongoose');

// Auth Logs Schema
const authLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  identifier: { type: String }, // phone or email
  loginMethod: { type: String, enum: ['PASSWORD', 'GOOGLE', 'OTP'] },
  event: { type: String, required: true }, // LOGIN_REQUESTED, OTP_SENT, LOGIN_SUCCESS, etc.
  status: { type: String }, // SUCCESS, FAILED
  ipAddress: { type: String },
  userAgent: { type: String },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Login History Schema
const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginMethod: { type: String },
  identifier: { type: String },
  loginTime: { type: Date, default: Date.now, index: true },
  logoutTime: { type: Date },
  status: { type: String }, // ACTIVE, LOGGED_OUT
  deviceInfo: { type: String }
});

// Activity Logs Schema
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  role: { type: String },
  action: { type: String, required: true }, // USER_REGISTERED, ORDER_CREATED, etc.
  module: { type: String }, // Auth, Order, Fleet
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

// System Logs Schema
const systemLogSchema = new mongoose.Schema({
  level: { type: String, enum: ['INFO', 'WARN', 'ERROR', 'FATAL'], required: true },
  service: { type: String, required: true },
  message: { type: String, required: true },
  stack: { type: String },
  endpoint: { type: String },
  method: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Order History Schema
const orderHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  AuthLog: mongoose.model('AuthLog', authLogSchema),
  LoginHistory: mongoose.model('LoginHistory', loginHistorySchema),
  ActivityLog: mongoose.model('ActivityLog', activityLogSchema),
  SystemLog: mongoose.model('SystemLog', systemLogSchema),
  OrderHistory: mongoose.model('OrderHistory', orderHistorySchema)
};
