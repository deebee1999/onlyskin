const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// ==============================
// GET current user profile
// ==============================
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(
      'SELECT id, username, email, avatar_url, bio, banner_url FROM users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ error: 'Unable to fetch profile' });
  }
});

// ==============================
// PUT update user profile
// ==============================
router.put('/', auth, async (req, res) => {
  const userId = req.user.id;
  const { bio = '', avatar_url = '', banner_url = '' } = req.body;

  console.log('🔧 PUT /api/profile');
  console.log('👤 userId:', userId);
  console.log('📥 Incoming data:', { bio, avatar_url, banner_url });

  if (
    typeof bio !== 'string' ||
    typeof avatar_url !== 'string' ||
    typeof banner_url !== 'string'
  ) {
    console.warn('⚠️ Invalid input types:', req.body);
    return res.status(400).json({ error: 'Invalid input types' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE users
       SET bio = $1, avatar_url = $2, banner_url = $3
       WHERE id = $4
       RETURNING id, username, email, avatar_url, bio, banner_url`,
      [bio, avatar_url, banner_url, userId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Profile update error:', err);
    res.status(500).json({ error: 'Unable to update profile' });
  }
});

module.exports = router;
