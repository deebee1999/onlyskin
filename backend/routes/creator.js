/* =========================================================================
   File: backend/routes/creator.js
   Purpose: Creator routes (profile + posts)
   - GET    /api/creator/:username           → public profile (creator or subscriber)
   - PUT    /api/creator/:username/bio       → update bio (owner only)
   - GET    /api/creator/:username/posts     → creator's posts (auth required)
   ========================================================================= */
/* =========================================================
   File: backend/routes/creator.js
   Purpose: Creator profile + posts routes
   ========================================================= */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

console.log('[CreatorRoutes] loaded'); // <-- shows on server start

// Quick mount check: GET /api/creator/__ping  => { ok: true }
router.get('/__ping', (req, res) => res.json({ ok: true }));

// Map a users row to a normalized profile payload
function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email || null,
    bio: row.bio || '',
    role: row.role || null,
    avatar_url: row.avatar_url || null,
    banner_url: row.banner_url || null,
    created_at: row.created_at || null
  };
}

/* =========================================================
   GET /api/creator/:username  (public)
   ========================================================= */
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userRes = await pool.query(
      `SELECT id, username, email, bio, role, avatar_url, banner_url, created_at
       FROM users
       WHERE username ILIKE $1
       LIMIT 1`,
      [username]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = mapUserRow(userRes.rows[0]);
    return res.json(profile);
  } catch (err) {
    console.error('Error fetching creator profile:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* =========================================================
   PUT /api/creator/:username/bio  (owner-only)
   ========================================================= */
router.put('/:username/bio', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const { bio } = req.body || {};
  const requesterId = req.user?.id;

  try {
    const userRes = await pool.query(
      `SELECT id, username, email, bio, role, avatar_url, banner_url, created_at
       FROM users
       WHERE username ILIKE $1
       LIMIT 1`,
      [username]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const target = userRes.rows[0];

    if (!requesterId || requesterId !== target.id) {
      return res.status(403).json({ error: 'Forbidden: not the profile owner' });
    }

    const updRes = await pool.query(
      `UPDATE users
         SET bio = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, bio, role, avatar_url, banner_url, created_at`,
      [typeof bio === 'string' ? bio : '', target.id]
    );

    const updated = mapUserRow(updRes.rows[0]);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating bio:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* =========================================================
   GET /api/creator/:username/posts  (auth required)
   ========================================================= */
router.get('/:username/posts', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const userId = req.user.id;

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Invalid user' });
    }

    const creatorRes = await pool.query(
      'SELECT id FROM users WHERE username ILIKE $1 AND role = $2',
      [username, 'creator']
    );
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creatorId = creatorRes.rows[0].id;

    const postsRes = await pool.query(
      'SELECT id, title, content, price, created_at FROM posts WHERE creator_id = $1 ORDER BY created_at DESC',
      [creatorId]
    );

    if (postsRes.rows.length === 0) {
      return res.json([]);
    }

    const postIds = postsRes.rows.map((p) => p.id);

    const mediaRes = await pool.query(
      'SELECT post_id, url, media_type AS type FROM post_media WHERE post_id = ANY($1::int[])',
      [postIds]
    );

    const mediaMap = {};
    mediaRes.rows.forEach(({ post_id, url, type }) => {
      if (!mediaMap[post_id]) mediaMap[post_id] = [];
      mediaMap[post_id].push({ url, type });
    });

    const purchaseRes = await pool.query(
      'SELECT post_id, created_at FROM purchases WHERE buyer_id = $1',
      [userId]
    );
    const purchases = purchaseRes.rows;

    const posts = postsRes.rows.map((post) => {
      const purchase = purchases.find((p) => p.post_id === post.id);
      const purchasedAt = purchase?.created_at;
      const expired = purchasedAt
        ? new Date(purchasedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : false;

      return {
        id: post.id,
        title: post.title,
        price: post.price,
        content: expired ? '' : post.content,
        unlocked: !!purchase && !expired,
        expired,
        purchased_at: purchasedAt,
        media_urls: mediaMap[post.id] || [],
        userIsCreator: userId === creatorId
      };
    });

    return res.json(posts);
  } catch (err) {
    console.error('Error fetching creator posts:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
