const express = require('express');
const auth = require('../middleware/auth');
const { getQuery, allQuery, runQuery } = require('../db');
const router = express.Router();

router.get('/profile/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  const current = req.userId;
  try {
    const user = await getQuery('SELECT id, username, email, fullName, bio, avatar as profileImage, createdAt FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const posts = await allQuery(`
      SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ?) as isLiked
      FROM posts p WHERE p.userId = ? ORDER BY p.createdAt DESC
    `, [current, userId]);
    const followers = await getQuery('SELECT COUNT(*) as count FROM follows WHERE followingId = ?', [userId]);
    const following = await getQuery('SELECT COUNT(*) as count FROM follows WHERE followerId = ?', [userId]);
    const isFollowed = await getQuery('SELECT id FROM follows WHERE followerId = ? AND followingId = ?', [current, userId]);
    res.json({
      user,
      posts: posts.map(p => ({ ...p, isLiked: p.isLiked === 1 })),
      followers: followers.count,
      following: following.count,
      isFollowed: !!isFollowed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  const { bio, fullName, profileImage } = req.body;
  const updates = [];
  const params = [];
  if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
  if (fullName !== undefined) { updates.push('fullName = ?'); params.push(fullName); }
  if (profileImage !== undefined) { updates.push('avatar = ?'); params.push(profileImage); }
  if (updates.length === 0) return res.json({ message: 'no updates' });
  params.push(req.userId);
  await runQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  const user = await getQuery('SELECT id, username, email, fullName, bio, avatar as profileImage FROM users WHERE id = ?', [req.userId]);
  res.json(user);
});

router.get('/search', auth, async (req, res) => {
  const { q = '' } = req.query;
  const users = await allQuery(
    `SELECT id, username, fullName, avatar as profileImage, bio FROM users WHERE id != ? AND (username LIKE ? OR fullName LIKE ?) LIMIT 20`,
    [req.userId, `%${q}%`, `%${q}%`]
  );
  for (let u of users) {
    const followed = await getQuery('SELECT id FROM follows WHERE followerId = ? AND followingId = ?', [req.userId, u.id]);
    u.isFollowed = !!followed;
  }
  res.json(users);
});

router.get('/:userId/following', auth, async (req, res) => {
  const { userId } = req.params;
  const following = await allQuery(`
    SELECT u.id, u.username, u.fullName, u.avatar as profileImage, u.bio
    FROM follows f JOIN users u ON f.followingId = u.id
    WHERE f.followerId = ?
  `, [userId]);
  res.json(following);
});

router.get('/:userId/followers', auth, async (req, res) => {
  const { userId } = req.params;
  const followers = await allQuery(`
    SELECT u.id, u.username, u.fullName, u.avatar as profileImage, u.bio
    FROM follows f JOIN users u ON f.followerId = u.id
    WHERE f.followingId = ?
  `, [userId]);
  res.json(followers);
});

module.exports = router;