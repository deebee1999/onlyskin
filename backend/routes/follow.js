// backend/routes/follow.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/follow/:username
router.post('/:username', authMiddleware, async (req, res) => {
  const followerId = req.user.id;
  const { username } = req.params;

  try {
    const targetUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followingId = targetUser.rows[0].id;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const exists = await pool.query(
      'SELECT * FROM followers WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (exists.rows.length > 0) {
      // Already following → unfollow
      await pool.query(
        'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
      return res.status(200).json({ message: 'Unfollowed' });
    } else {
      // Not following → follow
      await pool.query(
  'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)',
  [followerId, followingId]
);

// 🔔 Create follow notification
await pool.query(
  `INSERT INTO notifications (user_id, type, metadata)
   VALUES ($1, $2, $3)`,
  [followingId, 'follow', JSON.stringify({ follower_id: followerId })]
);

return res.status(200).json({ message: 'Followed' });
  
    }
  } catch (err) {
    console.error('Follow/unfollow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
