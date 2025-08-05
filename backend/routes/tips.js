// backend/routes/tips.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Create a new tip
router.post('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;
  const { amount } = req.body;
  const senderId = req.user.id;

  try {
    const creatorRes = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (creatorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creatorId = creatorRes.rows[0].id;

    await db.query(
      'INSERT INTO tips (sender_id, receiver_id, amount) VALUES ($1, $2, $3)',
      [senderId, creatorId, amount]
    );

    res.status(201).json({ message: 'Tip sent successfully' });
  } catch (err) {
    console.error('Error sending tip:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
