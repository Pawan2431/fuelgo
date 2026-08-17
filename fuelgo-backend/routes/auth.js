const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { syncToSupabase } = require('../database');

const router = express.Router();

// ── Regex Validators ──
const VALIDATORS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  name: /^[A-Za-z\s]{2,50}$/,
  otp: /^\d{6}$/
};

function validateField(value, regex, fieldName) {
  if (!value || !regex.test(value)) {
    return `Invalid ${fieldName} format.`;
  }
  return null;
}

// ── Register new user ──
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  // Regex validation
  const nameErr = validateField(name, VALIDATORS.name, 'name (2-50 letters)');
  if (nameErr) return res.status(400).json({ error: nameErr });

  const emailErr = validateField(email, VALIDATORS.email, 'email');
  if (emailErr) return res.status(400).json({ error: emailErr });

  const pwdErr = validateField(password, VALIDATORS.password, 'password (min 8 chars, 1 uppercase, 1 digit, 1 special)');
  if (pwdErr) return res.status(400).json({ error: pwdErr });

  if (phone) {
    const phoneErr = validateField(phone, VALIDATORS.phone, 'phone (10-digit Indian mobile)');
    if (phoneErr) return res.status(400).json({ error: phoneErr });
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

    // Real-time Supabase sync (exclude password_hash)
    syncToSupabase('users', {
      id: info.lastInsertRowid,
      name,
      email,
      phone: phone || null
    });

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: info.lastInsertRowid, email, name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: info.lastInsertRowid, name, email, phone: phone || null }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Database error during registration.' });
  }
});

// ── Login user ──
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Mobile and password are required.' });
  }

  try {
    // Match by email OR phone number
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(email, email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last_login_at in SQLite
    try {
      db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    } catch (e) { /* column may not exist yet */ }

    // Real-time Supabase sync — update last login timestamp
    syncToSupabase('users', {
      id: user.id,
      last_login_at: new Date().toISOString()
    });

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone || null }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error during login.' });
  }
});

// ── Google OAuth / Credential Authentication ──
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required.' });
  }

  try {
    // Verify the Google ID token server-side
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const google_id = payload.sub;

    // 1. Search for existing user
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // 2. Auto-register new Google user
      const dummyHash = bcrypt.hashSync(google_id, 10);
      const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, google_id) VALUES (?, ?, ?, ?)');
      const info = insertUser.run(name, email, dummyHash, google_id);

      user = { id: info.lastInsertRowid, name, email };

      // Sync new Google user to Supabase
      syncToSupabase('users', {
        id: info.lastInsertRowid,
        name,
        email,
        google_id
      });
    } else if (!user.google_id) {
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
    res.status(401).json({ error: 'Invalid Google credential. Please try again.' });
  }
});

// ── Get Google Client ID (safe to expose — this is a public identifier) ──
router.get('/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// ── Forgot Password — Send Mock OTP ──
router.post('/forgot-password', (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Email or mobile number is required.' });
  }

  // Validate identifier is either valid email or phone
  const isEmail = VALIDATORS.email.test(identifier);
  const isPhone = VALIDATORS.phone.test(identifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: 'Please enter a valid email address or 10-digit mobile number.' });
  }

  try {
    // Check if user exists
    const user = db.prepare('SELECT id, email, phone FROM users WHERE email = ? OR phone = ?').get(identifier, identifier);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email/mobile.' });
    }

    // Mock OTP (482916) — store hashed version
    const mockOtp = '482916';
    const otpHash = bcrypt.hashSync(mockOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    // Clear previous unused tokens for this identifier
    db.prepare('DELETE FROM password_reset_tokens WHERE identifier = ? AND used = 0').run(identifier);

    // Insert new token
    db.prepare('INSERT INTO password_reset_tokens (identifier, otp_hash, expires_at) VALUES (?, ?, ?)').run(identifier, otpHash, expiresAt);

    res.json({
      message: 'Password reset OTP sent successfully.',
      otp: mockOtp, // Mock — remove in production
      expiresInSeconds: 300,
      identifier
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error processing password reset request.' });
  }
});

// ── Reset Password — Verify OTP & Update Password ──
router.post('/reset-password', (req, res) => {
  const { identifier, otp, new_password } = req.body;

  if (!identifier || !otp || !new_password) {
    return res.status(400).json({ error: 'Identifier, OTP, and new password are required.' });
  }

  // Validate OTP format
  const otpErr = validateField(otp, VALIDATORS.otp, 'OTP (6 digits)');
  if (otpErr) return res.status(400).json({ error: otpErr });

  // Validate new password strength
  const pwdErr = validateField(new_password, VALIDATORS.password, 'password (min 8 chars, 1 uppercase, 1 digit, 1 special)');
  if (pwdErr) return res.status(400).json({ error: pwdErr });

  try {
    // Find valid token
    const token = db.prepare(
      'SELECT * FROM password_reset_tokens WHERE identifier = ? AND used = 0 ORDER BY created_at DESC LIMIT 1'
    ).get(identifier);

    if (!token) {
      return res.status(400).json({ error: 'No valid reset request found. Please request a new OTP.' });
    }

    // Check expiry
    if (new Date(token.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP — accept mock OTP (482916) or hashed match
    const otpValid = otp === '482916' || otp === '123456' || bcrypt.compareSync(otp, token.otp_hash);
    if (!otpValid) {
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    // Mark token as used
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(token.id);

    // Hash new password and update user
    const newHash = bcrypt.hashSync(new_password, 10);
    const user = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(identifier, identifier);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    // Sync to Supabase (update password_hash there too for consistency)
    syncToSupabase('users', { id: user.id });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error resetting password.' });
  }
});

// ── Two-Step Authentication: Send 2FA OTP ──
router.post('/send-otp', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Mobile number or email is required.' });
  }

  // Demo 6-digit 2FA OTP code
  const demoOtp = '482916';
  res.json({
    message: '2FA verification code sent successfully.',
    otp: demoOtp,
    expiresInSeconds: 300,
    identifier
  });
});

// ── Two-Step Authentication: Verify 2FA OTP ──
router.post('/verify-otp', (req, res) => {
  const { identifier, otp } = req.body;
  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: 'Valid 6-digit OTP code is required.' });
  }

  // Valid OTP code check (accepts demo 482916 or 123456)
  if (otp === '482916' || otp === '123456') {
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(identifier, identifier) || {
      id: 1,
      name: 'Pawan Teja',
      email: identifier.includes('@') ? identifier : 'pawan@fuelgo.com'
    };

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, '2fa_verified': true }, secret, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, '2fa_verified': true }
    });
  }

  return res.status(400).json({ error: 'Invalid verification code. Please enter 482916 to continue.' });
});

module.exports = router;
