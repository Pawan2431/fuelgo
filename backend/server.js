require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const connectMongoDB = require('./mongodb');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectMongoDB();

// Middleware — Allow all origins (Vercel frontend, Android app, local dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const pricesRoutes = require('./routes/prices');
const stationsRoutes = require('./routes/stations');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const upiPaymentsRoutes = require('./routes/upi_payments');
const logsRoutes = require('./routes/logs');

app.use('/api/auth', authRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/upi-payments', upiPaymentsRoutes);
app.use('/api/logs', logsRoutes);

// API Documentation & Status Route
app.get('/api', (req, res) => {
  res.json({
    name: 'FuelGo Backend SQLite Database API',
    version: '2.0.0',
    status: 'ONLINE',
    database: 'Supabase Cloud DB (PostgreSQL) + SQLite Cache',
    supabase_url: 'https://feshnblvfdhjvgehklvd.supabase.co',
    endpoints: {
      prices: { method: 'GET', url: '/api/prices', description: 'Fetch fuel rates for Petrol, Diesel, CNG, EV, Premium, LPG' },
      stations: { method: 'GET', url: '/api/stations', description: 'Fetch all gas stations with ratings and available fuels' },
      login: { method: 'POST', url: '/api/auth/login', description: 'Authenticate user credentials & issue JWT token' },
      google_auth: { method: 'POST', url: '/api/auth/google', description: 'Real Google Sign-In & automatic user record provisioning' },
      register: { method: 'POST', url: '/api/auth/register', description: 'Register a new user in the SQLite database' },
      orders: { method: 'GET / POST', url: '/api/orders', description: 'Fetch order history or place a new fuel order' },
      agent_tracking: { method: 'PATCH', url: '/api/orders/:id/location', description: 'Update driver live GPS coordinates in real-time' }
    }
  });
});

const path = require('path');

// Serve APK downloads
app.use('/download', express.static(__dirname));

// Serve React Frontend
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
app.use((err, req, res, next) => {
  logger.error("Express Error Handler:", err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`\n--- FuelGo API Routes ---`);
  logger.info(`[POST] /api/auth/register`);
  logger.info(`[POST] /api/auth/login`);
  logger.info(`[GET]  /api/prices`);
  logger.info(`[GET]  /api/stations`);
  logger.info(`[GET]  /api/stations/:id`);
  logger.info(`[POST] /api/orders`);
  logger.info(`[GET]  /api/orders`);
  logger.info(`[GET]  /api/orders/:id`);
  logger.info(`[PATCH] /api/orders/:id/status`);
  logger.info(`[PATCH] /api/orders/:id/location`);
  logger.info(`-------------------------`);
  logger.info(`FuelGo API running on http://localhost:${PORT}`);
});
