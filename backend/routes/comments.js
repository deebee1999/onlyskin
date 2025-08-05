const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// =============================
// POST /api/comments/:post_id
// =============================
router.post('/:post_id', auth, async (req, res) => {
  const { content } = req.body;
  const { post_id } = req.params;
  const user_id = req.user.id;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const result = await db.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *',
      [user_id, post_id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================
// GET /api/comments/:post_id
// =============================
router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;

  try {
    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [post_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
