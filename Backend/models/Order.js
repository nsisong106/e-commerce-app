const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,     // copied at purchase time
        price: Number,    // copied at purchase time
        quantity: Number
      }
    ],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      phone: String
    },
    total: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentReference: String,
    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);