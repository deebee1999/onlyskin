// backend/routes/home.js
const express = require('express');
const router = express.Router();

// GET /api/home
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to OnlySkins Home API' });
});

module.exports = router;
