const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password, fullName } = req.body;
  try {
    const existing = await getQuery('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const id = Date.now() + '-' + Math.random().toString(36);
    const hashed = await bcrypt.hash(password, 10);
    const avatar = `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`;
    await runQuery(
      'INSERT INTO users (id, username, email, password, fullName, bio, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, email, hashed, fullName, 'Hello! I am new on Pulse', avatar, new Date().toISOString()]
    );
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET);
    const user = await getQuery('SELECT id, username, email, fullName, bio, avatar FROM users WHERE id = ?', [id]);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;