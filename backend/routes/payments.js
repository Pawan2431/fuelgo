const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const verifyToken = require('../middleware/auth');
const db = require('../database');

// Create a PaymentIntent
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  const { amount, currency = 'inr', order_id } = req.body;

  try {
    // Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Amount must be in smallest currency unit (e.g. paise for INR, cents for USD)
    // Assuming amount passed is in whole rupees, we multiply by 100
    
    // Intelligent Fallback: If no real key is provided, use simulation mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
      console.log('Running in Stripe Simulation Mode (No real key provided)');
      return res.json({ clientSecret: 'mock_secret_for_testing' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      metadata: {
        order_id: order_id || 'unknown',
        user_id: req.user.id
      },
      // In a real app, you might want to automatically save cards, etc.
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Optional: Stripe Webhook for fulfilling orders after payment
// This would usually run without verifyToken because Stripe calls it directly
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    
    if (orderId && orderId !== 'unknown') {
      try {
        const update = db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?");
        update.run(orderId);
        console.log(`Order ${orderId} marked as paid via Stripe webhook.`);
      } catch (dbErr) {
        console.error('Database error updating order status:', dbErr);
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;
