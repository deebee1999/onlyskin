// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/* ============================================================================
   GET /api/profile/self            → current user (via JWT)
   GET /api/profile/:username       → user by username (case-insensitive)
   Returns: { user: { id, username, email, role, bio, avatar_url } }
   ========================================================================== */

router.get('/self', authMiddleware, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT id, username, email, role, bio, avatar_url
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [req.user.id]
    );
    if (q.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: q.rows[0] });
  } catch (err) {
    console.error('GET /api/profile/self error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const q = await pool.query(
      `SELECT id, username, email, role, bio, avatar_url
         FROM users
        WHERE LOWER(username) = LOWER($1)
        LIMIT 1`,
      [username]
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: q.rows[0] });
  } catch (err) {
    console.error('GET /api/profile/:username error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
