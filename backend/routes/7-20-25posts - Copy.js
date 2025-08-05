const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// =========================
// GET /api/posts/dashboard — Get posts for logged-in creator
// =========================
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, title, content, price, created_at, is_pinned
       FROM posts
       WHERE creator_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [userId]
    );
    console.log('✅ Query returned rows:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching dashboard posts:', err);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});

/*
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching dashboard posts:', err);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});
*/

// =========================
// GET /api/posts/:username — Get posts by public username
// =========================
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT posts.*, users.username, users.avatar_url 
       FROM posts 
       JOIN users ON posts.creator_id = users.id 
       WHERE LOWER(users.username) = LOWER($1)
       ORDER BY posts.created_at DESC`,
      [username]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts by username:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================
// PATCH /api/posts/:id/pin — Pin or unpin a post
// =========================
router.patch('/:id/pin', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { is_pinned } = req.body;

  try {
    const result = await pool.query(
      'UPDATE posts SET is_pinned = $1 WHERE id = $2 RETURNING *',
      [is_pinned, postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error pinning/unpinning post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;




/*  deleted as of 7-20-25
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// =========================
// GET all posts by creator username
// =========================
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT posts.*, users.username, users.avatar_url 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       WHERE users.username = $1
       ORDER BY posts.created_at DESC`,
      [username]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================
// PATCH /api/posts/:id/pin — Pin or unpin a post
// =========================
router.patch('/:id/pin', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { is_pinned } = req.body;

  try {
    const result = await pool.query(
      'UPDATE posts SET is_pinned = $1 WHERE id = $2 RETURNING *',
      [is_pinned, postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error pinning/unpinning post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

*/
