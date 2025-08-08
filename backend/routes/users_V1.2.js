const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// ✅ Existing routes here...

// ✅ Add your /profile route HERE, below the other routes
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Looking up user ID:', userId);

    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ No user found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ PROFILE RESULT:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🚨 Error in /profile route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =========================
// GET /api/user/:username
// =========================
router.get('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, username, email, role, bio FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user by username:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ✅ This must be at the bottom:
module.exports = router;
