const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Mass DM to all subscribers
router.post('/mass', auth, async (req, res) => {
  const { message } = req.body;
  const creatorId = req.user.id;

  try {
    const subsRes = await pool.query(
      'SELECT subscriber_id FROM subscriptions WHERE creator_id = $1',
      [creatorId]
    );

    if (subsRes.rows.length === 0) {
      return res.status(400).json({ error: 'No subscribers to message' });
    }

    const values = subsRes.rows.map(
      subId => `(${creatorId}, ${subId.subscriber_id}, '${message.replace(/'/g, "''")}', FALSE)`
    ).join(',');

    await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, content, is_read) VALUES ${values}`
    );

    res.json({ message: 'Mass DM sent successfully' });
  } catch (err) {
    console.error('Mass DM error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send individual message
router.post('/send', auth, async (req, res) => {
  const { recipientId, message } = req.body;
  const senderId = req.user.id;

  try {
    await pool.query(
      'INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3)',
      [senderId, recipientId, message]
    );

    res.json({ message: 'Message sent' });
  } catch (err) {
    console.error('Send DM error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get inbox messages for current user
router.get('/inbox', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_id, u.username AS sender_username, m.content, m.is_read, m.created_at
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.recipient_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Inbox error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
router.post('/read', auth, async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user.id;

  try {
    const update = await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE id = $1 AND recipient_id = $2',
      [messageId, userId]
    );

    if (update.rowCount === 0) {
      return res.status(400).json({ error: 'Message not found or not yours' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
