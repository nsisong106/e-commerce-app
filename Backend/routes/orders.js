const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

// Create an order (logged-in users)
router.post('/', protect, async (req, res) => {
  const reserved = []; // stock we took, so we can give it back if something fails
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      fail(400, 'Order must have at least one item');
    }
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
      fail(400, 'Shipping street, city and phone are required');
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const qty = parseInt(item.quantity);
      if (!mongoose.isValidObjectId(item.product) || !(qty > 0)) {
        fail(400, 'Each item needs a valid product id and a quantity above 0');
      }

      // Take the stock only if enough is left
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!product) fail(400, 'A product is unavailable or has not enough stock');

      reserved.push({ id: product._id, qty });
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty
      });
      total += product.price * qty;
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      total
    });

    res.status(201).json(order);
  } catch (err) {
    for (const r of reserved) {
      await Product.findByIdAndUpdate(r.id, { $inc: { stock: r.qty } });
    }
    res.status(err.status || 500).json({ message: err.message });
  }
});

// My orders (logged-in users). Must come before '/:id'
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All orders (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// One order (its owner or an admin)
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status (admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { orderStatus, paymentStatus } = req.body;

    if (orderStatus) {
      if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }
      if (order.orderStatus === 'cancelled' && orderStatus !== 'cancelled') {
        return res.status(400).json({ message: 'Cancelled orders cannot be reopened' });
      }
      if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;