const express = require('express');
const auth = require('../middleware/auth');
const { runQuery, getQuery } = require('../db');
const router = express.Router();

router.post('/:userId', auth, async (req, res) => {
  if (req.params.userId === req.userId) return res.status(400).json({ error: 'Cannot follow self' });
  const existing = await getQuery('SELECT id FROM follows WHERE followerId = ? AND followingId = ?', [req.userId, req.params.userId]);
  if (!existing) {
    const id = Date.now() + '-' + Math.random().toString(36);
    await runQuery('INSERT INTO follows (id, followerId, followingId) VALUES (?, ?, ?)', [id, req.userId, req.params.userId]);
  }
  const followersCount = await getQuery('SELECT COUNT(*) as count FROM follows WHERE followingId = ?', [req.params.userId]);
  res.json({ followersCount: followersCount.count, isFollowing: true });
});


router.delete('/:userId', auth, async (req, res) => {
  await runQuery('DELETE FROM follows WHERE followerId = ? AND followingId = ?', [req.userId, req.params.userId]);
  const followersCount = await getQuery('SELECT COUNT(*) as count FROM follows WHERE followingId = ?', [req.params.userId]);
  res.json({ followersCount: followersCount.count, isFollowing: false });
});

module.exports = router;