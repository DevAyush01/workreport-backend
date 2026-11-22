const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

// Routes import karein
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Setup Route (Database update karne ke liye ek baar chalayein)
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, password VARCHAR(100), role VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
     CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE,
        in_time VARCHAR(20),
        out_time VARCHAR(20),
        work_description TEXT,
        hours_spent NUMERIC,
        links TEXT,
        pending_work TEXT,
        pending_reason TEXT
      );
    `);
    res.send("Tables created/updated successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// NAYA ROUTE YAHAN HAI
app.get('/api/update-db', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS pending_reason TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS in_time VARCHAR(20);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS out_time VARCHAR(20);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS pending_work TEXT;
    `);
    res.send("Database updated with new columns!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Routes ka use karein
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});