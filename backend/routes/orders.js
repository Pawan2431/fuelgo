const express = require('express');
const db = require('../database');
const { syncToSupabase } = require('../database');
const verifyToken = require('../middleware/auth');
const brevoEmailService = require('../services/brevoEmailService');
const Order = require('../models/Order');
const MongoLogger = require('../utils/mongoLogger');

const router = express.Router();

// Place a new order
router.post('/', verifyToken, async (req, res) => {
  const { station_id, fuel_type, quantity_litres, payment_method, delivery_address, delivery_lat, delivery_lng } = req.body;
  const user_id = req.user.id;

  if (!station_id || !fuel_type || !quantity_litres || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields for order.' });
  }

  try {
    // 1. Verify Station exists in SQLite
    const station = db.prepare('SELECT id FROM stations WHERE id = ?').get(station_id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found.' });
    }

    // 2. Normalize and Fetch Fuel Price
    let normalizedFuel = fuel_type.toLowerCase();
    if (normalizedFuel.includes('diesel')) normalizedFuel = 'diesel';
    else if (normalizedFuel.includes('petrol')) normalizedFuel = 'petrol';
    else if (normalizedFuel.includes('ev')) normalizedFuel = 'ev';
    else if (normalizedFuel.includes('adblue')) normalizedFuel = 'diesel'; // fallback

    const fuel = db.prepare('SELECT price_per_unit FROM fuel_prices WHERE LOWER(fuel_type) = LOWER(?)').get(normalizedFuel);
    if (!fuel) {
      return res.status(400).json({ error: 'Invalid fuel type: ' + fuel_type });
    }

    // 3. Calculate total & tracking defaults
    const total_price = fuel.price_per_unit * quantity_litres;
    const eta_minutes = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
    const address = delivery_address || 'Chetipedu, Tamil Nadu — 602105';
    const lat = delivery_lat || 12.9734;
    const lng = delivery_lng || 79.9328;

    // 4. Create Order in MongoDB
    const newOrder = await Order.create({
      userId: user_id,
      stationId: station_id,
      fuelType: fuel_type,
      quantity: quantity_litres,
      totalPrice: total_price,
      paymentMethod: payment_method,
      deliveryAddress: address,
      deliveryLat: lat,
      deliveryLng: lng,
      etaMinutes: eta_minutes,
      status: 'confirmed'
    });

    // Log Activity
    await MongoLogger.logActivity({
      userId: user_id,
      action: 'ORDER_CREATED',
      module: 'Order',
      description: `Order placed for ${quantity_litres}L of ${fuel_type}`,
      metadata: { orderId: newOrder._id }
    });

    // Log Order History
    await MongoLogger.logOrderHistory({
      orderId: newOrder._id,
      userId: user_id,
      newStatus: 'confirmed',
      notes: 'Order placed'
    });

    res.json({
      order_id: newOrder._id,
      total_price,
      eta_minutes,
      status: 'confirmed',
      delivery_address: address,
      delivery_location: { lat, lng },
      agent: newOrder.assignedDriver
    });

  } catch (error) {
    console.error('Order error:', error);
    await MongoLogger.logSystem('ERROR', 'OrderService', 'Database error while placing order', { error: error.message });
    res.status(500).json({ error: 'Database error while placing order.' });
  }
});

// Update agent tracking location for active order
router.patch('/:id/location', verifyToken, async (req, res) => {
  const { agent_lat, agent_lng, eta_minutes } = req.body;
  
  if (!agent_lat || !agent_lng) {
    return res.status(400).json({ error: 'Missing agent coordinates.' });
  }
  
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.assignedDriver.lat = agent_lat;
    order.assignedDriver.lng = agent_lng;
    if (eta_minutes !== undefined) order.etaMinutes = eta_minutes;

    await order.save();

    await MongoLogger.logActivity({
      userId: req.user.id,
      action: 'FLEET_UPDATED',
      module: 'Order',
      description: 'Agent tracking location updated',
      metadata: { orderId: order._id }
    });

    res.json({ success: true, message: 'Agent tracking location updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Database error updating tracking location.' });
  }
});

// Mark order as paid
router.patch('/:id/pay', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'paid' }, { new: true });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await MongoLogger.logActivity({
      userId: req.user.id,
      action: 'ORDER_UPDATED',
      module: 'Order',
      description: 'Order marked as paid',
      metadata: { orderId: order._id }
    });

    res.json({ success: true, message: 'Order marked as paid.' });
  } catch (error) {
    res.status(500).json({ error: 'Database error updating payment status.' });
  }
});

// ADMIN: Get stats
router.get('/admin/stats', verifyToken, async (req, res) => {
  if (req.user.email !== 'admin@fuelgo.com' && req.user.email !== 'pullagurapawanteja@gmail.com') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const orders = await Order.find();
    
    let totalRevenue = 0;
    let activeDeliveries = 0;
    let pendingUpi = 0;

    for (const o of orders) {
      if (o.status === 'delivered') {
        totalRevenue += o.totalPrice || 0;
      }
      if (o.status === 'out_for_delivery') {
        activeDeliveries++;
      }
      if (o.paymentStatus === 'pending') {
        pendingUpi++;
      }
    }

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      activeDeliveries,
      pendingUpi
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching admin stats.' });
  }
});

// ADMIN: Get all orders (Admin only)
router.get('/admin/all', verifyToken, async (req, res) => {
  if (req.user.email !== 'admin@fuelgo.com' && req.user.email !== 'pullagurapawanteja@gmail.com') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  try {
    const orders = await Order.find().populate('userId', 'name email phone').sort({ createdAt: -1 });
    
    // We map station details from SQLite if needed, or just return as is
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching all orders.' });
  }
});

// Get all orders for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching orders.' });
  }
});

// Get a single order
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found or unauthorized.' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching order.' });
  }
});

// Update order status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    const previousStatus = order.status;
    order.status = status;
    await order.save();

    await MongoLogger.logOrderHistory({
      orderId: order._id,
      userId: req.user.id,
      previousStatus,
      newStatus: status,
      changedBy: req.user.id,
      notes: `Status changed to ${status}`
    });

    await MongoLogger.logActivity({
      userId: req.user.id,
      action: 'ORDER_UPDATED',
      module: 'Order',
      description: `Order status changed to ${status}`,
      metadata: { orderId: order._id }
    });

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Database error while updating order.' });
  }
});

module.exports = router;
