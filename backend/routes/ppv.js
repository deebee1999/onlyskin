const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/ppv/purchase
router.post('/purchase', authMiddleware, async (req, res) => {
  const { post_id } = req.body;
  const userId = req.user.id;

  console.log('🔓 POST /api/ppv/purchase called');
  console.log('📦 post_id:', post_id);
  console.log('👤 userId:', userId);

  if (!post_id) {
    console.error('❌ Post ID missing in request body');
    return res.status(400).json({ error: 'Post ID required' });
  }

  try {
    // Check if already purchased
    const existing = await pool.query(
      'SELECT * FROM purchases WHERE user_id = $1 AND post_id = $2',
      [userId, post_id]
    );

    if (existing.rows.length > 0) {
      console.log('ℹ️ Already purchased');
      return res.status(200).json({ message: 'Already purchased' });
    }

    // ✅ Get post price
    const postResult = await pool.query(
      'SELECT price FROM posts WHERE id = $1',
      [post_id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const priceDollars = postResult.rows[0].price;
    const amountCents = Math.round(priceDollars * 100);

    // ✅ Insert purchase with amount_cents
    await pool.query(
      'INSERT INTO purchases (user_id, post_id, amount_cents) VALUES ($1, $2, $3)',
      [userId, post_id, amountCents]
    );

// 🔔 Get creator of the post
const creatorResult = await pool.query(
  'SELECT creator_id FROM posts WHERE id = $1',
  [post_id]
);
const creatorId = creatorResult.rows[0]?.creator_id;

if (creatorId) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, metadata)
     VALUES ($1, $2, $3)`,
    [creatorId, 'unlock', JSON.stringify({ buyer_id: userId, post_id })]
  );
}


    console.log('✅ Purchase inserted successfully');
    res.status(200).json({ message: 'Unlocked successfully' });
  } catch (err) {
    console.error('❌ Purchase error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
