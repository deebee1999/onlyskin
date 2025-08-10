// backend/routes/follow.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/* =============================================================================
   FOLLOW ROUTES
   - POST   /api/follow/toggle     { username }
   - POST   /api/follow/:username  (back-compat toggle)
   - DELETE /api/follow/:username  (explicit UNFOLLOW)  ✅ fixes 404 you saw
   Strategy for toggle: DELETE first, then INSERT if nothing deleted.
   ========================================================================== */

async function toggleByUsername({ followerId, targetUsername }) {
  const uname = String(targetUsername || '').trim();
  if (!uname) return { status: 400, body: { error: 'username is required' } };

  const targetRes = await pool.query(
    'SELECT id, username FROM users WHERE username = $1',
    [uname]
  );
  if (targetRes.rows.length === 0) {
    return { status: 404, body: { error: 'User not found' } };
  }
  const userId = targetRes.rows[0].id;
  if (userId === followerId) {
    return { status: 400, body: { error: 'You cannot follow yourself' } };
  }

  // Try to UNFOLLOW first
  const delRes = await pool.query(
    'DELETE FROM followers WHERE follower_id = $1 AND user_id = $2 RETURNING follower_id',
    [followerId, userId]
  );
  if (delRes.rowCount > 0) {
    const counts = await getCounts(userId, followerId);
    return { status: 200, body: { message: 'Unfollowed', following: false, ...counts } };
  }

  // If not following, FOLLOW
  await pool.query(
    `INSERT INTO followers (follower_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [followerId, userId]
  );

  await pool.query(
    `INSERT INTO notifications (user_id, type, message, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      userId,
      'follow',
      'You have a new follower.',
      JSON.stringify({ follower_id: followerId }),
    ]
  );

  const counts = await getCounts(userId, followerId);
  return { status: 200, body: { message: 'Followed', following: true, ...counts } };
}

/* POST /api/follow/toggle  Body: { username } */
router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const { username } = req.body || {};
    const result = await toggleByUsername({ followerId, targetUsername: username });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Follow/toggle error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* Back-compat: POST /api/follow/:username  (toggle) */
router.post('/:username', authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const { username } = req.params;
    const result = await toggleByUsername({ followerId, targetUsername: username });
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Follow/unfollow error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* NEW: DELETE /api/follow/:username  (explicit UNFOLLOW) */
router.delete('/:username', authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const uname = String(req.params.username || '').trim();

    if (!uname) return res.status(400).json({ error: 'username is required' });

    const targetRes = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [uname]
    );
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = targetRes.rows[0].id;
    if (userId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const delRes = await pool.query(
      'DELETE FROM followers WHERE follower_id = $1 AND user_id = $2 RETURNING follower_id',
      [followerId, userId]
    );

    if (delRes.rowCount === 0) {
      return res.status(200).json({ message: 'Already not following', following: false });
    }

    const counts = await getCounts(userId, followerId);
    return res.status(200).json({ message: 'Unfollowed', following: false, ...counts });
  } catch (err) {
    console.error('Follow/delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* Counts helper */
async function getCounts(targetUserId, viewerId) {
  const followersRes = await pool.query(
    'SELECT COUNT(*)::int AS c FROM followers WHERE user_id = $1',
    [targetUserId]
  );
  const followingRes = await pool.query(
    'SELECT COUNT(*)::int AS c FROM followers WHERE follower_id = $1',
    [viewerId]
  );
  return {
    followers: followersRes.rows[0].c,
    following: followingRes.rows[0].c,
  };
}

// GET /api/follow/status/:username  -> { following: boolean }
router.get('/status/:username', authMiddleware, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const { username } = req.params;

    // find target user
    const target = await pool.query(
      'SELECT id FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1',
      [username]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const targetId = target.rows[0].id;

    // do I (viewer) follow target?
    const exists = await pool.query(
      'SELECT 1 FROM followers WHERE follower_id=$1 AND user_id=$2 LIMIT 1',
      [viewerId, targetId]
    );

    return res.json({ following: exists.rows.length > 0 });
  } catch (err) {
    console.error('GET /api/follow/status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
