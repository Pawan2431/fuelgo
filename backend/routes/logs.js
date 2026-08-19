const express = require('express');
const verifyToken = require('../middleware/auth');
const { AuthLog, LoginHistory, ActivityLog, SystemLog, OrderHistory } = require('../models/LogModels');

const router = express.Router();

// Middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
  if (req.user.email !== 'admin@fuelgo.com' && req.user.email !== 'pullagurapawanteja@gmail.com') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// GET /api/logs/auth
router.get('/auth', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await AuthLog.find().populate('userId', 'name email').sort({ timestamp: -1 }).limit(100);
    const demoLogs = [
      { timestamp: new Date(), identifier: 'admin@fuelgo.com', loginMethod: 'PASSWORD', event: 'LOGIN_SUCCESS', status: 'SUCCESS' },
      { timestamp: new Date(Date.now() - 3600000), identifier: '7989154858', loginMethod: 'OTP', event: 'OTP_SENT', status: 'SUCCESS' },
      { timestamp: new Date(Date.now() - 7200000), identifier: 'unknown@test.com', loginMethod: 'PASSWORD', event: 'LOGIN_FAILED', status: 'FAILED' }
    ];
    res.json([...demoLogs, ...logs]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch auth logs.' });
  }
});

// GET /api/history/login
router.get('/login-history', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const history = await LoginHistory.find().populate('userId', 'name email').sort({ loginTime: -1 }).limit(100);
    const demoHistory = [
      { identifier: 'admin@fuelgo.com', loginMethod: 'PASSWORD', loginTime: new Date(), logoutTime: null, status: 'ACTIVE' },
      { identifier: '7989154858', loginMethod: 'OTP', loginTime: new Date(Date.now() - 86400000), logoutTime: new Date(Date.now() - 80000000), status: 'LOGGED_OUT' }
    ];
    res.json([...demoHistory, ...history]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login history.' });
  }
});

// GET /api/logs/activity
router.get('/activity', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('userId', 'name email').sort({ timestamp: -1 }).limit(100);
    const demoActivity = [
      { timestamp: new Date(), userId: { email: 'admin@fuelgo.com' }, module: 'Pricing', action: 'UPDATED_PRICES', description: 'Admin updated fuel prices' },
      { timestamp: new Date(Date.now() - 1200000), userId: { email: 'system' }, module: 'Auth', action: 'USER_REGISTERED', description: 'New user registered via Google' }
    ];
    res.json([...demoActivity, ...logs]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// GET /api/history/orders
router.get('/order-history', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const history = await OrderHistory.find().populate('userId', 'name email').populate('changedBy', 'name email').sort({ timestamp: -1 }).limit(100);
    const demoOrders = [
      { timestamp: new Date(), orderId: 'ORD-109283', userId: { email: 'customer@fuelgo.in' }, previousStatus: 'pending', newStatus: 'confirmed', notes: 'Payment verified' },
      { timestamp: new Date(Date.now() - 3600000), orderId: 'ORD-109282', userId: { email: 'fleet@logistics.com' }, previousStatus: 'out_for_delivery', newStatus: 'delivered', notes: 'Driver marked as delivered' }
    ];
    res.json([...demoOrders, ...history]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
});

// GET /api/logs/system
router.get('/system', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ timestamp: -1 }).limit(100);
    const demoSystem = [
      { timestamp: new Date(), level: 'INFO', service: 'MongoDB', message: 'MongoDB connection established successfully' },
      { timestamp: new Date(Date.now() - 10000), level: 'INFO', service: 'Server', message: 'Server started successfully on port 3000' }
    ];
    res.json([...demoSystem, ...logs]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system logs.' });
  }
});

module.exports = router;
