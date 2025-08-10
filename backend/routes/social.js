// backend/routes/social.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

/* =============================================================================
   SOCIAL LIST ROUTES (with pagination)
   - GET /api/social/followers/:username?page=1&limit=25
   - GET /api/social/following/:username?page=1&limit=25
   Returns:
     {
       users: [{ id, username, role, avatar_url, is_following }],
       pagination: { page, limit, total, totalPages, hasPrev, hasNext }
     }
   Notes:
     • Username match is case-insensitive
     • is_following is from the VIEWER's perspective (req.user.id)
   ========================================================================== */

function parsePageLimit(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const rawLimit = parseInt(req.query.limit, 10);
  const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 25 : rawLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function getUserIdByUsername(username) {
  const q = await pool.query(
    `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username]
  );
  return q.rows[0]?.id || null;
}

/* Followers of :username */
router.get('/followers/:username', authMiddleware, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const { username } = req.params;
    const { page, limit, offset } = parsePageLimit(req);

    const targetId = await getUserIdByUsername(username);
    if (!targetId) return res.status(404).json({ error: 'User not found' });

    // Total followers
    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM followers WHERE user_id = $1`,
      [targetId]
    );
    const total = totalRes.rows[0].total;

    // Page of followers (users who follow target)
    const listRes = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.role,
        u.avatar_url,
        EXISTS(
          SELECT 1
          FROM followers vf
          WHERE vf.follower_id = $1  -- viewer follows this listed user?
            AND vf.user_id = u.id
        ) AS is_following
      FROM followers f
      JOIN users u ON u.id = f.follower_id
      WHERE f.user_id = $2
      ORDER BY u.username ASC
      LIMIT $3 OFFSET $4
      `,
      [viewerId, targetId, limit, offset]
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      users: listRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.error('GET /api/social/followers/:username error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Following of :username */
router.get('/following/:username', authMiddleware, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const { username } = req.params;
    const { page, limit, offset } = parsePageLimit(req);

    const targetId = await getUserIdByUsername(username);
    if (!targetId) return res.status(404).json({ error: 'User not found' });

    // Total following
    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM followers WHERE follower_id = $1`,
      [targetId]
    );
    const total = totalRes.rows[0].total;

    // Page of users the target follows
    const listRes = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.role,
        u.avatar_url,
        EXISTS(
          SELECT 1
          FROM followers vf
          WHERE vf.follower_id = $1  -- viewer follows this listed user?
            AND vf.user_id = u.id
        ) AS is_following
      FROM followers f
      JOIN users u ON u.id = f.user_id
      WHERE f.follower_id = $2
      ORDER BY u.username ASC
      LIMIT $3 OFFSET $4
      `,
      [viewerId, targetId, limit, offset]
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      users: listRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.error('GET /api/social/following/:username error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
