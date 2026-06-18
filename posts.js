const express = require('express');
const auth = require('../middleware/auth');
const { getQuery, runQuery, allQuery } = require('../db');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { mode = 'global' } = req.query;
  try {
    let sql = `
      SELECT p.*, u.username, u.fullName as authorName, u.avatar as authorImage,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ?) as isLiked
      FROM posts p JOIN users u ON p.userId = u.id
    `;
    let params = [req.userId];
    if (mode === 'following') {
      sql += ` WHERE p.userId IN (SELECT followingId FROM follows WHERE followerId = ?)`;
      params.push(req.userId);
    }
    sql += ` ORDER BY p.createdAt DESC`;
    const posts = await allQuery(sql, params);

    const followIds = await allQuery('SELECT followingId FROM follows WHERE followerId = ?', [req.userId]);
    const followingSet = new Set(followIds.map(f => f.followingId));
 

    const enriched = posts.map(p => ({
      id: p.id,
      authorId: p.userId,
      content: p.content,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      isLiked: p.isLiked === 1,
      isFollowingAuthor: followingSet.has(p.userId),
      authorName: p.authorName,
      authorImage: p.authorImage,
      username: p.username
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { content, imageUrl } = req.body;
  const id = Date.now() + '-' + Math.random().toString(36);
  await runQuery(
    'INSERT INTO posts (id, userId, content, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, req.userId, content, imageUrl || '', new Date().toISOString()]
  );
  res.json({ id });
});

router.delete('/:id', auth, async (req, res) => {
  const post = await getQuery('SELECT userId FROM posts WHERE id = ?', [req.params.id]);
  if (!post || post.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
  await runQuery('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.post('/:id/like', auth, async (req, res) => {
  const existing = await getQuery('SELECT id FROM likes WHERE userId = ? AND postId = ?', [req.userId, req.params.id]);
  if (!existing) {
    const id = Date.now() + '-' + Math.random().toString(36);
    await runQuery('INSERT INTO likes (id, userId, postId) VALUES (?, ?, ?)', [id, req.userId, req.params.id]);
  }
  const likesCount = await getQuery('SELECT COUNT(*) as count FROM likes WHERE postId = ?', [req.params.id]);
  res.json({ likesCount: likesCount.count, isLiked: true });
});

router.delete('/:id/like', auth, async (req, res) => {
  await runQuery('DELETE FROM likes WHERE userId = ? AND postId = ?', [req.userId, req.params.id]);
  const likesCount = await getQuery('SELECT COUNT(*) as count FROM likes WHERE postId = ?', [req.params.id]);
  res.json({ likesCount: likesCount.count, isLiked: false });
});

module.exports = router;