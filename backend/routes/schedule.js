const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Create a scheduled post
router.post('/', authenticateToken, async (req, res) => {
  const { content, media_url, scheduled_at } = req.body;
  try {
    await db.query(
      'INSERT INTO scheduled_posts (creator_id, content, media_url, scheduled_at) VALUES ($1, $2, $3, $4)',
      [req.user.id, content, media_url, scheduled_at]
    );
    res.json({ message: 'Post scheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not schedule post' });
  }
});

module.exports = router;
