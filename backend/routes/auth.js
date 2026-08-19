const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MongoLogger = require('../utils/mongoLogger');
const brevoEmailService = require('../services/brevoEmailService');

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

const getIpAndUserAgent = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress,
  userAgent: req.headers['user-agent']
});

// ── Register new user ──
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

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
    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password_hash,
      phone: phone || null
    });

    brevoEmailService.sendWelcomeEmail(email, name).catch(e => console.error("Welcome email failed", e));

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: newUser._id, email, name }, secret, { expiresIn: '7d' });

    // Activity Log
    await MongoLogger.logActivity({
      userId: newUser._id,
      action: 'USER_REGISTERED',
      module: 'Auth',
      description: 'New user registered via standard form'
    });

    res.json({
      token,
      user: { id: newUser._id, name, email, phone: phone || null }
    });
  } catch (error) {
    console.error('Register error:', error);
    await MongoLogger.logSystem('ERROR', 'AuthService', 'Database error during registration', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Database error during registration.' });
  }
});

// ── Login user ──
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email/Mobile and password are required.' });
  }

  try {
    const user = await User.findOne({ $or: [{ email: email }, { phone: email }] });

    if (!user) {
      await MongoLogger.logAuth({
        identifier: email,
        loginMethod: 'PASSWORD',
        event: 'LOGIN_FAILED',
        status: 'FAILED',
        errorMessage: 'Invalid email or password.',
        ...getIpAndUserAgent(req)
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      await MongoLogger.logAuth({
        userId: user._id,
        identifier: email,
        loginMethod: 'PASSWORD',
        event: 'LOGIN_FAILED',
        status: 'FAILED',
        errorMessage: 'Invalid email or password.',
        ...getIpAndUserAgent(req)
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await MongoLogger.logAuth({
      userId: user._id,
      identifier: email,
      loginMethod: 'PASSWORD',
      event: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      ...getIpAndUserAgent(req)
    });

    await MongoLogger.logLoginHistory({
      userId: user._id,
      loginMethod: 'PASSWORD',
      identifier: email,
      status: 'ACTIVE',
      deviceInfo: req.headers['user-agent']
    });

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || null }
    });
  } catch (error) {
    console.error('Login error:', error);
    await MongoLogger.logSystem('ERROR', 'AuthService', 'Database error during login', { error: error.message });
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

    let user = await User.findOne({ email });

    if (!user) {
      const dummyHash = await bcrypt.hash(google_id, 10);
      user = await User.create({
        name,
        email,
        password_hash: dummyHash,
        google_id
      });
      
      await MongoLogger.logActivity({
        userId: user._id,
        action: 'USER_REGISTERED',
        module: 'Auth',
        description: 'New user registered via Google'
      });
    } else if (!user.google_id) {
      user.google_id = google_id;
    }

    user.lastLoginAt = new Date();
    await user.save();

    await MongoLogger.logAuth({
      userId: user._id,
      identifier: email,
      loginMethod: 'GOOGLE',
      event: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      ...getIpAndUserAgent(req)
    });

    await MongoLogger.logLoginHistory({
      userId: user._id,
      loginMethod: 'GOOGLE',
      identifier: email,
      status: 'ACTIVE',
      deviceInfo: req.headers['user-agent']
    });

    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, auth_provider: 'google' }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, auth_provider: 'google' }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    await MongoLogger.logAuth({
      loginMethod: 'GOOGLE',
      event: 'LOGIN_FAILED',
      status: 'FAILED',
      errorMessage: 'Invalid Google credential.',
      ...getIpAndUserAgent(req)
    });
    res.status(401).json({ error: 'Invalid Google credential. Please try again.' });
  }
});

router.get('/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// ── Logout ──
router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  
  if (userId) {
    await MongoLogger.logAuth({
      userId: userId,
      event: 'LOGOUT',
      status: 'SUCCESS',
      ...getIpAndUserAgent(req)
    });
    
    await MongoLogger.updateLogoutHistory(userId);
  }
  
  res.json({ success: true });
});

// ── Simulated OTP: Send SMS OTP ──
router.post('/send-otp', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Invalid mobile number.' });
  }

  const isEmail = VALIDATORS.email.test(identifier);
  const isPhone = VALIDATORS.phone.test(identifier);
  const numericPhone = identifier.replace(/\D/g, '');

  if (!isEmail && (!isPhone || numericPhone.length < 10)) {
    return res.status(400).json({ error: 'Please enter a valid email or 10-digit mobile number.' });
  }

  try {
    if (isEmail) {
      brevoEmailService.sendOtpEmail(identifier, '123456').catch(e => console.error("OTP email failed", e));
    }

    const user = await User.findOne({ $or: [{ email: identifier }, { phone: numericPhone }] });
    
    await MongoLogger.logAuth({
      userId: user ? user._id : null,
      identifier,
      loginMethod: 'OTP',
      event: 'OTP_SENT',
      status: 'SUCCESS',
      ...getIpAndUserAgent(req)
    });

    res.json({
      success: true,
      message: 'OTP sent successfully (Simulated).',
      expiresInSeconds: 300,
      identifier
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// ── Simulated OTP: Verify SMS OTP ──
router.post('/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  if (!otp || otp.length < 4) {
    return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }

  const numericPhone = identifier.replace(/\D/g, '');

  if (otp !== '123456') {
    await MongoLogger.logAuth({
      identifier,
      loginMethod: 'OTP',
      event: 'OTP_FAILED',
      status: 'FAILED',
      errorMessage: 'Invalid OTP.',
      ...getIpAndUserAgent(req)
    });
    return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }

  try {
    const isEmail = VALIDATORS.email.test(identifier);
    let user;
    if (isEmail) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ $or: [{ phone: numericPhone }, { phone: identifier }] });
    }
    
    if (user) {
      await MongoLogger.logAuth({
        userId: user._id,
        identifier,
        loginMethod: 'OTP',
        event: 'OTP_VERIFIED',
        status: 'SUCCESS',
        ...getIpAndUserAgent(req)
      });

      await MongoLogger.logAuth({
        userId: user._id,
        identifier,
        loginMethod: 'OTP',
        event: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        ...getIpAndUserAgent(req)
      });

      await MongoLogger.logLoginHistory({
        userId: user._id,
        loginMethod: 'OTP',
        identifier,
        status: 'ACTIVE',
        deviceInfo: req.headers['user-agent']
      });

      user.lastLoginAt = new Date();
      await user.save();

      const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
      const token = jwt.sign({ id: user._id, email: user.email, name: user.name, auth_provider: 'simulated_otp' }, secret, { expiresIn: '7d' });

      return res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, auth_provider: 'simulated_otp' }
      });
    }

    return res.json({
      success: true,
      message: 'OTP verified. Proceed to registration.',
      isNewUser: true
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Invalid OTP. Please try again.' });
  }
});

module.exports = router;
