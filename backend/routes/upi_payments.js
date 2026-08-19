const express = require('express');
const router = express.Router();
const db = require('../database');
const verifyToken = require('../middleware/auth');

// ── Helper: Check if user is admin ──
const ADMIN_EMAILS = ['admin@fuelgo.com'];
function isAdmin(req) {
  return req.user && (ADMIN_EMAILS.includes(req.user.email) || req.user.is_admin);
}

// ── GET /api/upi-payments/merchant-config (public) ──
// Returns merchant UPI ID and name for the customer payment screen
router.get('/merchant-config', (req, res) => {
  try {
    const config = db.prepare('SELECT merchant_name, merchant_upi_id, merchant_qr_data FROM merchant_config WHERE id = 1').get();
    if (!config) {
      return res.json({ merchant_name: 'FuelGo India', merchant_upi_id: 'fuelgo@upi', merchant_qr_data: null });
    }
    res.json(config);
  } catch (err) {
    console.error('merchant-config error:', err);
    res.status(500).json({ error: 'Failed to load merchant config.' });
  }
});

// ── PUT /api/upi-payments/merchant-config (admin only) ──
// Admin updates merchant name, UPI ID, or QR image
router.put('/merchant-config', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });

  const { merchant_name, merchant_upi_id, merchant_qr_data } = req.body;
  if (!merchant_name || !merchant_upi_id) {
    return res.status(400).json({ error: 'Merchant name and UPI ID are required.' });
  }

  try {
    db.prepare(`
      INSERT INTO merchant_config (id, merchant_name, merchant_upi_id, merchant_qr_data, updated_at, updated_by)
      VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(id) DO UPDATE SET
        merchant_name = excluded.merchant_name,
        merchant_upi_id = excluded.merchant_upi_id,
        merchant_qr_data = excluded.merchant_qr_data,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = excluded.updated_by
    `).run(merchant_name, merchant_upi_id, merchant_qr_data || null, req.user.name || req.user.email);

    res.json({ success: true, message: 'Merchant config updated.' });
  } catch (err) {
    console.error('Update merchant config error:', err);
    res.status(500).json({ error: 'Failed to update merchant config.' });
  }
});

// ── POST /api/upi-payments/submit (authenticated customer) ──
// Customer submits UTR number after paying
router.post('/submit', verifyToken, (req, res) => {
  const { order_id, amount, utr_number, screenshot_base64 } = req.body;

  if (!order_id || !amount || !utr_number) {
    return res.status(400).json({ error: 'Order ID, amount, and UTR number are required.' });
  }

  // Sanitize UTR - remove spaces, make uppercase
  const cleanUtr = utr_number.trim().toUpperCase();
  if (cleanUtr.length < 6) {
    return res.status(400).json({ error: 'Invalid UTR number. Please enter the correct transaction reference.' });
  }

  try {
    // Check for duplicate UTR
    const dupCheck = db.prepare('SELECT id, order_id FROM upi_payments WHERE utr_number = ?').get(cleanUtr);
    if (dupCheck) {
      return res.status(409).json({
        error: `This UTR number is already linked to Order #${dupCheck.order_id}. Each transaction can only be used once.`
      });
    }

    // Get customer details from the user record
    const userRecord = db.prepare('SELECT name, email, phone FROM users WHERE id = ?').get(req.user.id);

    // Insert payment record
    const result = db.prepare(`
      INSERT INTO upi_payments (order_id, user_id, customer_name, customer_email, customer_phone, amount, utr_number, screenshot_base64, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_VERIFICATION_PENDING')
    `).run(
      order_id,
      req.user.id,
      userRecord?.name || req.user.name,
      userRecord?.email || req.user.email,
      userRecord?.phone || '',
      amount,
      cleanUtr,
      screenshot_base64 || null
    );

    // Update the order's payment_status
    try {
      db.prepare("UPDATE orders SET payment_status = 'PAYMENT_VERIFICATION_PENDING' WHERE id = ?").run(order_id);
    } catch(e) {}

    res.json({
      success: true,
      payment_id: result.lastInsertRowid,
      status: 'PAYMENT_VERIFICATION_PENDING',
      message: 'Payment submitted successfully. Your payment will be verified by the admin within a few hours.'
    });
  } catch (err) {
    console.error('Submit UPI payment error:', err);
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'This UTR number has already been submitted.' });
    }
    res.status(500).json({ error: 'Failed to submit payment. Please try again.' });
  }
});

// ── GET /api/upi-payments/status/:orderId (authenticated customer) ──
// Customer polls their payment verification status
router.get('/status/:orderId', verifyToken, (req, res) => {
  try {
    const payment = db.prepare(`
      SELECT id, order_id, amount, utr_number, payment_status, rejection_reason, submitted_at, verified_at
      FROM upi_payments WHERE order_id = ? AND user_id = ?
      ORDER BY submitted_at DESC LIMIT 1
    `).get(req.params.orderId, req.user.id);

    if (!payment) {
      return res.json({ status: 'PAYMENT_PENDING', message: 'No payment submitted yet.' });
    }

    res.json(payment);
  } catch (err) {
    console.error('Get payment status error:', err);
    res.status(500).json({ error: 'Failed to get payment status.' });
  }
});

// ── GET /api/upi-payments/admin/list (admin only) ──
// Admin sees all payment submissions with full details
router.get('/admin/list', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });

  try {
    const { status } = req.query; // optional filter: ?status=PAYMENT_VERIFICATION_PENDING
    let query = `
      SELECT p.*, 
             o.fuel_type, o.quantity_litres, o.delivery_address,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM upi_payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON p.user_id = u.id
    `;
    if (status) {
      query += ` WHERE p.payment_status = '${status.toUpperCase()}'`;
    }
    query += ` ORDER BY p.submitted_at DESC`;

    const payments = db.prepare(query).all();
    res.json({ payments, total: payments.length });
  } catch (err) {
    console.error('Admin list payments error:', err);
    res.status(500).json({ error: 'Failed to load payments.' });
  }
});

// ── POST /api/upi-payments/admin/verify/:id (admin only) ──
// Admin confirms payment received — marks as PAID
router.post('/admin/verify/:id', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });

  try {
    const payment = db.prepare('SELECT * FROM upi_payments WHERE id = ?').get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

    if (payment.payment_status === 'PAID') {
      return res.status(409).json({ error: 'This payment is already verified and marked as PAID.' });
    }

    // Mark payment as PAID with audit trail
    db.prepare(`
      UPDATE upi_payments SET
        payment_status = 'PAID',
        verified_at = CURRENT_TIMESTAMP,
        verified_by_id = ?,
        verified_by_name = ?,
        rejection_reason = NULL
      WHERE id = ?
    `).run(req.user.id, req.user.name || req.user.email, req.params.id);

    // Update the linked order
    db.prepare("UPDATE orders SET payment_status = 'PAID', status = 'confirmed' WHERE id = ?").run(payment.order_id);

    res.json({
      success: true,
      message: `Payment #${payment.id} (UTR: ${payment.utr_number}) verified and marked PAID.`,
      order_id: payment.order_id
    });
  } catch (err) {
    console.error('Admin verify payment error:', err);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// ── POST /api/upi-payments/admin/reject/:id (admin only) ──
// Admin rejects payment with a reason
router.post('/admin/reject/:id', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });

  const { reason } = req.body;
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A rejection reason of at least 5 characters is required.' });
  }

  try {
    const payment = db.prepare('SELECT * FROM upi_payments WHERE id = ?').get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

    if (payment.payment_status === 'PAID') {
      return res.status(409).json({ error: 'Cannot reject an already verified payment.' });
    }

    db.prepare(`
      UPDATE upi_payments SET
        payment_status = 'PAYMENT_REJECTED',
        rejection_reason = ?,
        verified_at = CURRENT_TIMESTAMP,
        verified_by_id = ?,
        verified_by_name = ?
      WHERE id = ?
    `).run(reason.trim(), req.user.id, req.user.name || req.user.email, req.params.id);

    // Update order status to rejected
    db.prepare("UPDATE orders SET payment_status = 'PAYMENT_REJECTED' WHERE id = ?").run(payment.order_id);

    res.json({
      success: true,
      message: `Payment #${payment.id} rejected. Customer will be notified.`,
      reason: reason.trim()
    });
  } catch (err) {
    console.error('Admin reject payment error:', err);
    res.status(500).json({ error: 'Failed to reject payment.' });
  }
});

module.exports = router;
