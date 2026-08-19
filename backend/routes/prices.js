const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/admin');

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

// Update fuel prices (Admin only)
router.put('/', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { prices } = req.body;
    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({ error: 'Invalid prices data. Expected an array.' });
    }

    const updateStmt = db.prepare('UPDATE fuel_prices SET price_per_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE fuel_type = ?');
    
    db.exec('BEGIN TRANSACTION');
    for (const p of prices) {
      if (p.fuel_type && p.price_per_unit !== undefined) {
        updateStmt.run(p.price_per_unit, p.fuel_type);
      }
    }
    db.exec('COMMIT');

    const updatedPrices = db.prepare('SELECT * FROM fuel_prices').all();
    res.json({ success: true, message: 'Prices updated successfully', prices: updatedPrices });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Database error while updating prices.' });
  }
});

module.exports = router;
