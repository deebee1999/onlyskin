const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// ✅ GET /api/user/stats
router.get('/stats', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const followerRes = await pool.query(
      'SELECT COUNT(*) FROM followers WHERE user_id = $1',
      [userId]
    );
    const followingRes = await pool.query(
      'SELECT COUNT(*) FROM followers WHERE follower_id = $1',
      [userId]
    );

    res.json({
      followers: parseInt(followerRes.rows[0].count, 10),
      following: parseInt(followingRes.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET /api/user/:username/follow-status
router.get('/:username/follow-status', authMiddleware, async (req, res) => {
  const viewerId = req.user.id;
  const { username } = req.params;

  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE username ILIKE $1',
      [username]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetId = userRes.rows[0].id;

    const followRes = await pool.query(
  'SELECT 1 FROM followers WHERE follower_id = $1 AND user_id = $2',
  [viewerId, targetId]
);


    res.json({ following: followRes.rows.length > 0 });
  } catch (err) {
    console.error('Follow status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
