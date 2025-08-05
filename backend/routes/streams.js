// FILE: /backend/routes/streams.js
const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// =========================
// ROUTE: POST /api/streams/start
// Creator starts a new stream
// BODY: { title }
// =========================
router.post('/start', async (req, res) => {
  try {
    const creatorId = 1;              // TODO: replace with real auth
    const { title } = req.body;
    const streamKey = `${creatorId}-${Date.now()}`;  // simple unique key

    const result = await pool.query(
      `INSERT INTO streams (creator_id, title, stream_key, is_live)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, title, stream_key, is_live`,
      [creatorId, title, streamKey]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =========================
// ROUTE: POST /api/streams/stop
// Stop the current live stream
// BODY: { stream_id }
// =========================
router.post('/stop', async (req, res) => {
  try {
    const { stream_id } = req.body;
    await pool.query(
      `UPDATE streams SET is_live = FALSE WHERE id = $1`,
      [stream_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =========================
// ROUTE: GET /api/streams/:username
// Get the live stream info for this creator
// =========================
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // find creator ID
    const u = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (!u.rows.length) return res.status(404).json({ error: 'Creator not found' });
    const creatorId = u.rows[0].id;
    // find live stream
    const s = await pool.query(
      `SELECT id, title, stream_key
         FROM streams
        WHERE creator_id = $1 AND is_live = TRUE
        ORDER BY created_at DESC
        LIMIT 1`,
      [creatorId]
    );
    if (!s.rows.length) return res.json({ is_live: false });
    res.json({ is_live: true, ...s.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
