const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/creator/:username/posts
router.get('/:username/posts', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const userId = req.user.id;

  try {
    // Case-insensitive username match
    const creatorRes = await pool.query(
      'SELECT id FROM users WHERE username ILIKE $1',
      [username]
    );

    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creatorId = creatorRes.rows[0].id;

    // Get posts with media URLs
    const postsRes = await pool.query(
      `
      SELECT 
        posts.id, posts.title, posts.content, posts.price,
        COALESCE(
          json_agg(
            json_build_object(
              'url', pm.url,
              'type', pm.media_type
            )
          ) FILTER (WHERE pm.url IS NOT NULL), 
          '[]'
        ) AS media_urls
      FROM posts
      LEFT JOIN post_media pm ON posts.id = pm.post_id
      WHERE posts.creator_id = $1
      GROUP BY posts.id
      ORDER BY posts.created_at DESC
      `,
      [creatorId]
    );

    // ✅ Fix: use buyer_id instead of user_id
    const purchaseRes = await pool.query(
      'SELECT post_id, created_at FROM purchases WHERE buyer_id = $1',
      [userId]
    );

    const purchases = purchaseRes.rows;

    // Merge posts with purchase data and expiration logic
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
        media_urls: post.media_urls || []
      };
    });

    res.json(posts);
  } catch (err) {
    console.error('Error fetching creator posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
