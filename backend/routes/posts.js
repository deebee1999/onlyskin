const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// ========== RATE LIMITERS ==========

const createPostLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user.id,
  message: { error: 'Post limit reached: Max 10 per day' },
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

// ========== ROUTES ==========

router.use(generalApiLimiter);

// GET /api/posts/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         posts.id, posts.title, posts.content, posts.price, posts.created_at, posts.is_pinned,
         COALESCE(json_agg(pm.url) FILTER (WHERE pm.url IS NOT NULL), '[]') AS media_urls
       FROM posts
       LEFT JOIN post_media pm ON posts.id = pm.post_id
       WHERE posts.creator_id = $1
       GROUP BY posts.id
       ORDER BY posts.is_pinned DESC, posts.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching dashboard posts:', err);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});

// GET /api/posts/:username
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         posts.*, users.username, users.avatar_url,
         COALESCE(json_agg(pm.url) FILTER (WHERE pm.url IS NOT NULL), '[]') AS media_urls
       FROM posts 
       JOIN users ON posts.creator_id = users.id
       LEFT JOIN post_media pm ON posts.id = pm.post_id
       WHERE LOWER(users.username) = LOWER($1)
       GROUP BY posts.id, users.username, users.avatar_url
       ORDER BY posts.created_at DESC`,
      [username]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts by username:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/posts/:id/pin
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

// POST /api/posts — Create post + save media
router.post('/', authenticateToken, createPostLimiter, async (req, res) => {
  let { title, content, price, is_pinned, media_urls = [] } = req.body;
  media_urls = media_urls.map((m) => new URL(m.url).pathname); // ✅ Fix applied here
  const creatorId = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO posts (creator_id, title, content, price, is_pinned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [creatorId, title || '', content || '', price || 0, is_pinned || false]
    );

    const post = result.rows[0];

    if (Array.isArray(media_urls) && media_urls.length > 0) {
      const insertMedia = media_urls.map((url) =>
        pool.query(
          `INSERT INTO post_media (post_id, url, media_type)
           VALUES ($1, $2, CASE 
                            WHEN $2 ILIKE '%.mp4' THEN 'video' 
                            ELSE 'image' 
                          END)`,
          [post.id, url]
        )
      );
      await Promise.all(insertMedia);
      console.log('🎥 Media to insert:', media_urls);
    }

    console.log('📝 Incoming post:', { title, content, price, is_pinned, media_urls });

    res.json(post);
  } catch (err) {
    console.error('❌ Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

module.exports = router;
