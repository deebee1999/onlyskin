// backend/routes/user.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/* =============================================================================
   GET /api/user/:username   → fetch profile by username (case-insensitive)
   PUT /api/user/bio         → update bio for the authenticated user
   ========================================================================== */

/* GET /api/user/:username */
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

    // Return as { user: {...} } to match your frontend expectation
    return res.json({ user: q.rows[0] });
  } catch (err) {
    console.error('GET /api/user/:username error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/user/bio  { bio } */
router.put('/bio', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bio = typeof req.body?.bio === 'string' ? req.body.bio : '';

    const q = await pool.query(
      `UPDATE users
       SET bio = $1
       WHERE id = $2
       RETURNING bio`,
      [bio, userId]
    );

    return res.json({ bio: q.rows[0].bio });
  } catch (err) {
    console.error('PUT /api/user/bio error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
