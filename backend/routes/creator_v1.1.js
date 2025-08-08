const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/creator/:username/posts
router.get('/:username/posts', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const userId = req.user.id;

// Ensure this user is a creator
const userRoleCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
if (userRoleCheck.rows.length === 0 || userRoleCheck.rows[0].role !== 'creator') {
  return res.status(403).json({ error: 'Access denied. Creators only.' });
}


  try {
    // Case-insensitive username match in subscribers table (NOT users)
    const creatorRes = await pool.query(
      'SELECT id FROM subscribers WHERE username ILIKE $1',
      [username]
    );

    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creatorId = creatorRes.rows[0].id;

    // Get creator's posts with media
    const postsRes = await pool.query(
      'SELECT id, title, content, price, created_at FROM posts WHERE creator_id = $1 ORDER BY created_at DESC',
      [creatorId]
    );

    // Fetch associated media
    const mediaRes = await pool.query(
      'SELECT post_id, url, media_type AS type FROM post_media WHERE post_id = ANY($1)',
      [postsRes.rows.map(p => p.id)]
    );

    const mediaMap = {};
    mediaRes.rows.forEach(({ post_id, url, type }) => {
      if (!mediaMap[post_id]) mediaMap[post_id] = [];
      mediaMap[post_id].push({ url, type });
    });

    // Purchases by the viewer
    const purchaseRes = await pool.query(
      'SELECT post_id, created_at FROM purchases WHERE buyer_id = $1',
      [userId]
    );
    const purchases = purchaseRes.rows;

    // Merge posts with purchase info and expiration
    const posts = postsRes.rows.map(post => {
      const purchase = purchases.find(p => p.post_id === post.id);
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

    res.json(posts);
  } catch (err) {
    console.error('Error fetching creator posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
