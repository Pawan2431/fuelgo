const bcrypt = require('bcryptjs');
const fs = require('fs');

// Initialize the SQLite database
const dbFile = process.env.DB_FILE || 'fuelgo.db';
let db;

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(dbFile);
  db.exec('PRAGMA journal_mode = WAL;');
} catch (err) {
  try {
    const Database = require('better-sqlite3');
    db = new Database(dbFile);
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {
    console.error('Failed to initialize SQLite database:', e.message);
  }
}

// Setup Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fuel_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fuel_type TEXT UNIQUE NOT NULL,
    price_per_unit REAL NOT NULL,
    unit TEXT NOT NULL,
    change_pct REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT,
    city TEXT NOT NULL,
    lat REAL,
    lng REAL,
    rating REAL,
    is_open BOOLEAN DEFAULT 1,
    fuels_available TEXT,
    distance_km REAL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    fuel_type TEXT NOT NULL,
    quantity_litres REAL NOT NULL,
    total_price REAL NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    eta_minutes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(station_id) REFERENCES stations(id)
  );
`);

// Check if seeding is needed
const checkPrices = db.prepare('SELECT COUNT(*) as count FROM fuel_prices').get();

if (checkPrices.count === 0) {
  console.log('Seeding initial data...');

  // 1. Seed Users
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)');
  const defaultPassword = bcrypt.hashSync('password123', 10);
  insertUser.run('Priya S.', 'priya@example.com', defaultPassword, '9876543210');
  insertUser.run('Rahul M.', 'rahul@example.com', defaultPassword, '9876543211');
  insertUser.run('Anita K.', 'anita@example.com', defaultPassword, '9876543212');
  insertUser.run('Admin User', 'admin@fuelgo.com', defaultPassword, '9876543213');
  insertUser.run('Test User', 'test@fuelgo.com', defaultPassword, '9876543214');

  // 2. Seed Fuel Prices
  const insertPrice = db.prepare('INSERT INTO fuel_prices (fuel_type, price_per_unit, unit, change_pct) VALUES (?, ?, ?, ?)');
  insertPrice.run('petrol', 94.72, 'L', 0.15);
  insertPrice.run('diesel', 87.62, 'L', 0.0);
  insertPrice.run('cng', 78.50, 'kg', -0.50);
  insertPrice.run('ev', 9.20, 'kWh', 0.0);
  insertPrice.run('premium', 112.00, 'L', 0.20);
  insertPrice.run('lpg', 68.00, 'kg', 0.0);

  // 3. Seed Stations in Chennai
  const insertStation = db.prepare('INSERT INTO stations (name, emoji, city, lat, lng, rating, is_open, fuels_available, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertStation.run('Indian Oil', '⛽', 'Chennai', 13.0827, 80.2707, 4.9, 1, JSON.stringify(['petrol', 'diesel']), 1.2);
  insertStation.run('BPCL', '🔵', 'Chennai', 13.0850, 80.2750, 4.8, 1, JSON.stringify(['petrol', 'diesel']), 2.5);
  insertStation.run('HP', '⚡', 'Chennai', 13.0800, 80.2710, 4.7, 1, JSON.stringify(['petrol', 'diesel', 'cng']), 3.1);
  insertStation.run('Shell', '🐚', 'Chennai', 13.0900, 80.2800, 4.9, 1, JSON.stringify(['petrol', 'diesel']), 4.5);
  insertStation.run('Tata Power EV', '⚡', 'Chennai', 13.0830, 80.2720, 4.6, 1, JSON.stringify(['ev']), 2.0);
  insertStation.run('Adani Gas', '🟡', 'Chennai', 13.0860, 80.2780, 4.5, 1, JSON.stringify(['cng']), 3.5);

  // 4. Seed Orders
  const insertOrder = db.prepare('INSERT INTO orders (user_id, station_id, fuel_type, quantity_litres, total_price, payment_method, status, eta_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertOrder.run(1, 1, 'petrol', 20, 1894.40, 'GPay', 'delivered', 0);
  insertOrder.run(2, 2, 'diesel', 50, 4381.00, 'Card', 'delivered', 0);
  insertOrder.run(3, 5, 'ev', 30, 276.00, 'Paytm', 'delivered', 0);
  insertOrder.run(1, 3, 'cng', 10, 785.00, 'Cash', 'delivered', 0);
  insertOrder.run(4, 1, 'petrol', 15, 1420.80, 'PhonePe', 'delivered', 0);
  insertOrder.run(2, 4, 'diesel', 100, 8762.00, 'Card', 'delivered', 0);
  insertOrder.run(5, 6, 'cng', 12, 942.00, 'GPay', 'delivered', 0);
  insertOrder.run(1, 1, 'petrol', 5, 473.60, 'Cash', 'delivered', 0);
  insertOrder.run(3, 2, 'diesel', 25, 2190.50, 'Card', 'delivered', 0);
  insertOrder.run(2, 5, 'ev', 50, 460.00, 'Paytm', 'delivered', 0);

  console.log('Seeding complete.');
}

module.exports = db;
