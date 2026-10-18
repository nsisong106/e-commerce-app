require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      console.log('Admin already exists');
    } else {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        password: hashed,
        role: 'admin'
      });
      console.log('Admin created');
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
