const express = require('express');
const router = express.Router(); // ✅ ensure router is defined
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');
const crypto = require('crypto');

// === Nodemailer setup ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS  // Gmail App Password
  }
});

// =========================
// POST /api/auth/signup
// =========================
router.post('/signup', async (req, res) => {
  const { username, email, password, role = 'subscriber' } = req.body;

  if (!['creator', 'subscriber'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be creator or subscriber' });
  }

  try {
    const exists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashed, role]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// =========================
// POST /api/auth/login
// =========================
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; 
  console.log('🔍 Login attempt with identifier:', identifier);


  try {
const userRes = await pool.query(
  `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
  [identifier]
);


console.log('🔎 DB result:', userRes.rows);


    if (userRes.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// =========================
// POST /api/auth/forgot-password
// =========================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Email not found' });
    }

    const userId = userRes.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    const resetLink = `https://onlyskins.com/reset-password?token=${token}`;

    // Send reset email
    await transporter.sendMail({
      from: `"OnlySkins Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - OnlySkins',
      html: `
        <p>You requested a password reset for your OnlySkins account.</p>
        <p><a href="${resetLink}" style="color:#ec4899;">Click here to reset your password</a></p>
        <p>This link will expire in 1 hour.</p>
      `
    });

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =========================
// POST /api/auth/reset-password
// =========================
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetRes = await pool.query(
      'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (resetRes.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const userId = resetRes.rows[0].user_id;
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
