const express = require('express');
const db = require('../database');
const { syncToSupabase } = require('../database');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Place a new order
router.post('/', verifyToken, (req, res) => {
  const { station_id, fuel_type, quantity_litres, payment_method, delivery_address, delivery_lat, delivery_lng } = req.body;
  const user_id = req.user.id;

  if (!station_id || !fuel_type || !quantity_litres || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields for order.' });
  }

  try {
    // 1. Verify Station exists
    const station = db.prepare('SELECT id FROM stations WHERE id = ?').get(station_id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found.' });
    }

    // 2. Fetch Fuel Price (Case-Insensitive)
    const fuel = db.prepare('SELECT price_per_unit FROM fuel_prices WHERE LOWER(fuel_type) = LOWER(?)').get(fuel_type);
    if (!fuel) {
      return res.status(400).json({ error: 'Invalid fuel type: ' + fuel_type });
    }

    // 3. Calculate total & tracking defaults
    const total_price = fuel.price_per_unit * quantity_litres;
    const eta_minutes = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
    const address = delivery_address || 'Chetipedu, Tamil Nadu — 602105';
    const lat = delivery_lat || 12.9734;
    const lng = delivery_lng || 79.9328;

    // 4. Insert Order into SQLite Database
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        user_id, station_id, fuel_type, quantity_litres, total_price, payment_method,
        delivery_address, delivery_lat, delivery_lng, agent_name, agent_phone, agent_lat, agent_lng, eta_minutes
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ravi Kumar', '9876500402', 12.9760, 79.9360, ?)
    `);
    
    const info = insertOrder.run(user_id, station_id, fuel_type, quantity_litres, total_price, payment_method, address, lat, lng, eta_minutes);

    // 5. Sync Order to Supabase Cloud Database
    syncToSupabase('orders', {
      id: info.lastInsertRowid,
      user_id,
      station_id,
      fuel_type,
      quantity_litres,
      total_price,
      payment_method,
      delivery_address: address,
      delivery_lat: lat,
      delivery_lng: lng,
      status: 'confirmed',
      eta_minutes
    });

    res.json({
      order_id: info.lastInsertRowid,
      total_price,
      eta_minutes,
      status: 'confirmed',
      delivery_address: address,
      delivery_location: { lat, lng },
      agent: {
        name: 'Ravi Kumar',
        phone: '9876500402',
        location: { lat: 12.9760, lng: 79.9360 }
      }
    });

  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: 'Database error while placing order.' });
  }
});

// Update agent tracking location for active order
router.patch('/:id/location', verifyToken, (req, res) => {
  const { agent_lat, agent_lng, eta_minutes } = req.body;
  try {
    const update = db.prepare('UPDATE orders SET agent_lat = ?, agent_lng = ?, eta_minutes = COALESCE(?, eta_minutes) WHERE id = ?');
    const result = update.run(agent_lat, agent_lng, eta_minutes, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ success: true, message: 'Agent tracking location updated in database.' });
  } catch (error) {
    res.status(500).json({ error: 'Database error updating tracking location.' });
  }
});

// Get all orders for the logged-in user
router.get('/', verifyToken, (req, res) => {
  const user_id = req.user.id;
  try {
    const orders = db.prepare(`
      SELECT o.*, s.name as station_name, s.emoji as station_emoji 
      FROM orders o
      JOIN stations s ON o.station_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(user_id);
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching orders.' });
  }
});

// Get a single order
router.get('/:id', verifyToken, (req, res) => {
  const user_id = req.user.id;
  try {
    const order = db.prepare(`
      SELECT o.*, s.name as station_name 
      FROM orders o
      JOIN stations s ON o.station_id = s.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(req.params.id, user_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found or unauthorized.' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching order.' });
  }
});

// Admin simulation: Update order status
router.patch('/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'assigned', 'en_route', 'delivered'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    const update = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    const result = update.run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Database error while updating order.' });
  }
});

module.exports = router;
