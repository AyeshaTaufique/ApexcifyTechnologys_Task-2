const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'social.db'));

db.serialize(() => {
  // After creating the posts table, add this:
  db.run(`ALTER TABLE posts ADD COLUMN imageUrl TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding imageUrl column:', err.message);
    } else if (err && err.message.includes('duplicate column')) {
      console.log('imageUrl column already exists');
    }
  });
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    createdAt TEXT
  )`);

  // Posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    imageUrl TEXT,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT,
    FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  // Likes table
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    postId TEXT NOT NULL,
    UNIQUE(userId, postId),
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(postId) REFERENCES posts(id) ON DELETE CASCADE
  )`);

  // Follows table
  db.run(`CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    followerId TEXT NOT NULL,
    followingId TEXT NOT NULL,
    UNIQUE(followerId, followingId),
    FOREIGN KEY(followerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(followingId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`ALTER TABLE posts ADD COLUMN commentsCount INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding commentsCount column:', err.message);
    }
  });
});

// Helper functions
const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
});
const getQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
});
const allQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});

module.exports = { db, runQuery, getQuery, allQuery };