// backend/routes/search.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// =========================
// GET /api/search/users?q=somequery
// =========================
router.get('/users', authMiddleware, async (req, res) => {
  const q = req.query.q;
  console.log('🔍 Incoming search request for:', q);

  if (!q) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, bio, role FROM users WHERE LOWER(username) LIKE LOWER($1)',

      [`%${q}%`]
    );

    res.json({ users: result.rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
