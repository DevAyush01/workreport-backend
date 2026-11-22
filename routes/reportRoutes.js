const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
  const { date, in_time, out_time, work_description, links, pending_work, pending_reason } = req.body;
  
  try {
    // Auto Calculate Hours (In-Time aur Out-Time ka difference)
    let calculatedHours = null;
    if (in_time && out_time) {
      const start = new Date(`1970-01-01T${in_time}:00`);
      const end = new Date(`1970-01-01T${out_time}:00`);
      let diff = (end - start) / (1000 * 60 * 60); // hours mein difference
      if (diff < 0) diff += 24; // Agar raat 12 baje ke baad ka time ho
      calculatedHours = diff.toFixed(1); // 1 decimal place tak
    }

    await pool.query(
      "INSERT INTO reports (user_id, date, in_time, out_time, work_description, hours_spent, links, pending_work, pending_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [req.user.id, date, in_time, out_time, work_description, calculatedHours, links, pending_work, pending_reason]
    );
    res.json({ message: "Report added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Own Reports
router.get('/', verifyToken, async (req, res) => {
  const { date } = req.query;
  let query = "SELECT * FROM reports WHERE user_id = $1";
  let params = [req.user.id];
  if (date) { query += " AND date = $2"; params.push(date); }
  query += " ORDER BY date DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;