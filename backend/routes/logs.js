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
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch auth logs.' });
  }
});

// GET /api/history/login
router.get('/login-history', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const history = await LoginHistory.find().populate('userId', 'name email').sort({ loginTime: -1 }).limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login history.' });
  }
});

// GET /api/logs/activity
router.get('/activity', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('userId', 'name email').sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// GET /api/history/orders
router.get('/order-history', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const history = await OrderHistory.find().populate('userId', 'name email').populate('changedBy', 'name email').sort({ timestamp: -1 }).limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
});

// GET /api/logs/system
router.get('/system', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system logs.' });
  }
});

module.exports = router;
