if (!process.env.VERCEL) {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Connect once and reuse the connection (needed on serverless)
let dbPromise = null;
function connectDB() {
  if (!dbPromise) {
    dbPromise = mongoose.connect(process.env.MONGO_URI).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));

// Only start a normal server when run with "npm start" on your computer
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error('Database connection failed:', err.message));
}

module.exports = app;