// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// ==============================
// GET all notifications for user
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==============================
// Mark all as read
// ==============================
router.put('/read-all', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==============================
// POST /api/notifications — Create notification (admin/internal/testing)
// ==============================
router.post('/', auth, async (req, res) => {
  const { user_id, type, metadata } = req.body;

  if (!user_id || !type) {
    return res.status(400).json({ error: 'user_id and type are required' });
  }

  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, metadata)
       VALUES ($1, $2, $3)`,
      [user_id, type, metadata || {}]
    );
    res.json({ message: 'Notification created' });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
