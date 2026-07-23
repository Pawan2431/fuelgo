const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const checkEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (checkEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)');
    const info = insertUser.run(name, email, password_hash, phone || null);

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: info.lastInsertRowid, email, name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: info.lastInsertRowid, name, email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error during registration.' });
  }
});

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error during login.' });
  }
});

// Real Google OAuth / Credential Authentication Endpoint
router.post('/google', (req, res) => {
  const { email, name, google_id, credential } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Google email address is required.' });
  }

  try {
    // 1. Search for existing Google or Email user in Database
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // 2. Auto-register new Google user into Database
      const userName = name || email.split('@')[0];
      const dummyHash = bcrypt.hashSync(google_id || 'google_oauth_user_2026', 10);
      const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, google_id) VALUES (?, ?, ?, ?)');
      const info = insertUser.run(userName, email, dummyHash, google_id || null);

      user = { id: info.lastInsertRowid, name: userName, email: email };
    } else if (google_id && !user.google_id) {
      // 3. Link existing user with Google ID
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(google_id, user.id);
    }

    // 4. Issue JWT Auth Token
    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, auth_provider: 'google' }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, auth_provider: 'google' }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Database error processing Google Sign-In.' });
  }
});

module.exports = router;
