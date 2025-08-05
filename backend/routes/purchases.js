// backend/routes/purchases.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// ✅ GET /api/purchases — Full purchased posts list (for "My Purchases" page)
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT posts.id, posts.title, posts.content, posts.price, users.username 
       FROM purchases 
       JOIN posts ON purchases.post_id = posts.id
       JOIN users ON posts.creator_id = users.id
       WHERE purchases.buyer_id = $1
       ORDER BY purchases.purchase_date DESC`,
      [userId]
    );

    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      price: post.price,
      creator: post.username
    }));

    res.json(posts);
  } catch (err) {
    console.error('❌ Error fetching purchased posts:', err);
    res.status(500).json({ error: 'Failed to fetch purchased posts' });
  }
});

// ✅ GET /api/purchases/mine — Just post_id + expiration (for frontend unlock logic)
router.get('/mine', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT post_id, expires_at
       FROM purchases
       WHERE buyer_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    const purchased = result.rows.map(row => ({
      postId: row.post_id,
      purchased_at: new Date(
        new Date(row.expires_at).getTime() - 7 * 24 * 60 * 60 * 1000
      ).toISOString()
    }));

    res.json({ purchased });
  } catch (err) {
    console.error('❌ Error fetching purchases (mine):', err);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

module.exports = router;
