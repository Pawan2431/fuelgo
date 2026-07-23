require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for dev
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const pricesRoutes = require('./routes/prices');
const stationsRoutes = require('./routes/stations');
const ordersRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/orders', ordersRoutes);

// API Documentation & Status Route
app.get('/api', (req, res) => {
  res.json({
    name: 'FuelGo Backend SQLite Database API',
    version: '2.0.0',
    status: 'ONLINE',
    database: 'fuelgo.db (SQLite)',
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

// Serve APK downloads & web app
app.use('/download', express.static(__dirname));
app.use(express.static(__dirname + '/..'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n--- FuelGo API Routes ---`);
  console.log(`[POST] /api/auth/register`);
  console.log(`[POST] /api/auth/login`);
  console.log(`[GET]  /api/prices`);
  console.log(`[GET]  /api/stations`);
  console.log(`[GET]  /api/stations/:id`);
  console.log(`[POST] /api/orders`);
  console.log(`[GET]  /api/orders`);
  console.log(`[GET]  /api/orders/:id`);
  console.log(`[PATCH] /api/orders/:id/status`);
  console.log(`[PATCH] /api/orders/:id/location`);
  console.log(`-------------------------`);
  console.log(`FuelGo API running on http://localhost:${PORT}`);
});
