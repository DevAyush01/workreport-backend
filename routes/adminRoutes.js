const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Sabhi routes ke liye verify aur admin check lagana
router.use(verifyToken, isAdmin);

// Create User
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, role]
    );
    res.json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE role != 'admin'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Reports (with filters)
router.get('/reports', async (req, res) => {
  const { user_id, date } = req.query;
  let query = `SELECT r.*, u.name as user_name, u.role FROM reports r JOIN users u ON r.user_id = u.id WHERE 1=1`;
  let params = [];
  let count = 1;

  if (user_id) { query += ` AND r.user_id = $${count}`; params.push(user_id); count++; }
  if (date) { query += ` AND r.date = $${count}`; params.push(date); count++; }
  query += " ORDER BY r.date DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Total Hours
router.get('/total-hours', async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = "SELECT SUM(hours_spent) as total FROM reports";
    let params = [];
    if (user_id) { query += " WHERE user_id = $1"; params.push(user_id); }
    const result = await pool.query(query, params);
    res.json({ total_hours: result.rows[0].total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;