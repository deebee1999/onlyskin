//------------ working... but before clean up------


// FILE: /backend/routes/profile.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, username, email, avatar_url, bio, banner_url FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 👇 ADD THIS PUT ROUTE BELOW THE GET ROUTE
router.put('/', authMiddleware, async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user.id;
  const { bio, avatar_url, banner_url } = req.body;

  try {
    const result = await db.query(
      `UPDATE users
       SET bio = $1, avatar_url = $2, banner_url = $3
       WHERE id = $4
       RETURNING id, username, email, avatar_url, bio, banner_url`,
      [bio, avatar_url, banner_url, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


