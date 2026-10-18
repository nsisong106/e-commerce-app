const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const PAYSTACK_URL = 'https://api.paystack.co';

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };
}

// Start a payment for one of my orders
router.post('/initialize', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This order is already paid' });
    }
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'This order was cancelled' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reference = `${order._id}-${Date.now()}`;

    const response = await fetch(`${PAYSTACK_URL}/transaction/initialize`, {
      method: 'POST',
      headers: paystackHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(order.total * 100), // Paystack uses kobo
        reference,
        callback_url: `${process.env.CLIENT_URL}/payment/callback`
      })
    });
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Could not start payment' });
    }

    res.json({ authorization_url: data.data.authorization_url, reference });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check a payment with Paystack and update the order
router.post('/verify', protect, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // our references look like: <orderId>-<timestamp>
    const orderId = String(reference).split('-')[0];
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid payment reference' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (order.paymentStatus === 'paid') return res.json(order);

    const response = await fetch(
      `${PAYSTACK_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: paystackHeaders() }
    );
    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(502).json({ message: data.message || 'Could not verify payment' });
    }

    const tx = data.data;

    if (tx.status === 'success') {
      if (tx.amount !== Math.round(order.total * 100)) {
        return res.status(400).json({ message: 'Paid amount does not match the order total' });
      }
      order.paymentStatus = 'paid';
      order.paymentReference = reference;
      await order.save();
    } else if (tx.status === 'failed') {
      order.paymentStatus = 'failed';
      await order.save();
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;