const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // ── DEMO BYPASS FOR MOCK TOKENS ──
  if (token && token.startsWith('mock_token_')) {
    req.user = { id: 'demo-admin-id', email: 'admin@fuelgo.com', role: 'admin' };
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'fuelgo_super_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = verifyToken;
