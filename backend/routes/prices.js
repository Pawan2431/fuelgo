const express = require('express');
const db = require('../database');

const router = express.Router();

// Get all fuel prices
router.get('/', (req, res) => {
  try {
    const prices = db.prepare('SELECT * FROM fuel_prices').all();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching prices.' });
  }
});

module.exports = router;
