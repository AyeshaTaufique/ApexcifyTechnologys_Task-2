const express = require('express');
const auth = require('../middleware/auth');
const { runQuery, allQuery, getQuery } = require('../db');
const router = express.Router();

router.get('/post/:postId', auth, async (req, res) => {
  const comments = await allQuery(`
    SELECT c.*, u.username, u.fullName, u.avatar as userImage
    FROM comments c JOIN users u ON c.userId = u.id
    WHERE c.postId = ? ORDER BY c.createdAt ASC
  `, [req.params.postId]);
  // Map to match frontend Comment type
  const formatted = comments.map(c => ({
    id: c.id,
    postId: c.postId,
    userId: c.userId,
    username: c.username,
    userImage: c.userImage,
    text: c.content,
    createdAt: c.createdAt
  }));
  res.json(formatted);
});

router.post('/post/:postId', auth, async (req, res) => {
  const { content } = req.body;
  const id = Date.now() + '-' + Math.random().toString(36);
  await runQuery(
    'INSERT INTO comments (id, postId, userId, content, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, req.params.postId, req.userId, content, new Date().toISOString()]
  );
  // Update commentsCount on post
  await runQuery(`UPDATE posts SET commentsCount = (SELECT COUNT(*) FROM comments WHERE postId = ?) WHERE id = ?`, [req.params.postId, req.params.postId]);
  const user = await getQuery('SELECT username, avatar FROM users WHERE id = ?', [req.userId]);
  res.json({
    id,
    content,
    createdAt: new Date().toISOString(),
    userId: req.userId,
    username: user.username,
    userImage: user.avatar,
    postId: req.params.postId
  });
});

router.delete('/:commentId', auth, async (req, res) => {
  const comment = await getQuery('SELECT userId, postId FROM comments WHERE id = ?', [req.params.commentId]);
  if (!comment || comment.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
  await runQuery('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
  await runQuery(`UPDATE posts SET commentsCount = (SELECT COUNT(*) FROM comments WHERE postId = ?) WHERE id = ?`, [comment.postId, comment.postId]);
  res.json({ success: true, postId: comment.postId });
});

module.exports = router;
