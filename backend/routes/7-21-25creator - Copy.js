//---------------code before 7 days content viewing limit
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

    // Get creator's posts
    const postsRes = await pool.query(
      'SELECT id, title, content, price FROM posts WHERE creator_id = $1',
      [creatorId]
    );

  /*  // Get viewer's purchases
    const purchaseRes = await pool.query(
      'SELECT post_id FROM purchases WHERE buyer_id = $1',
      [userId]
    );*/

// Get viewer's purchases
const purchaseRes = await pool.query(
  'SELECT post_id FROM purchases WHERE user_id = $1',
  [userId]
);



    const purchasedPostIds = purchaseRes.rows.map(p => p.post_id);

    // Format posts
    const posts = postsRes.rows.map(post => ({
      id: post.id,
      title: post.title,
      price: post.price,
      unlocked: purchasedPostIds.includes(post.id),
      content: purchasedPostIds.includes(post.id) ? post.content : ''
    }));

    res.json(posts);
  } catch (err) {
    console.error('Error fetching creator posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;






/* OLD WORKING (CASE SENSITIVE SEARCH)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/creator/:username/posts
router.get('/:username/posts', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const userId = req.user.id;

  try {
    // Find creator ID
    const creatorRes = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    const creatorId = creatorRes.rows[0].id;

    // Get posts
    const postsRes = await pool.query(
      'SELECT id, title, content, price FROM posts WHERE creator_id = $1',
      [creatorId]
    );

    // Get purchases of this viewer
    const purchaseRes = await pool.query(
      'SELECT post_id FROM purchases WHERE user_id = $1',
      [userId]
    );
    const purchasedPostIds = purchaseRes.rows.map(p => p.post_id);

    // Prepare response
    const posts = postsRes.rows.map(post => ({
      id: post.id,
      title: post.title,
      price: post.price,
      unlocked: purchasedPostIds.includes(post.id),
      content: purchasedPostIds.includes(post.id) ? post.content : ''
    }));

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;  */


