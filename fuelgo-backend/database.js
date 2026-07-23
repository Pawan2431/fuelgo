const bcrypt = require('bcryptjs');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase Cloud Database Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://feshnblvfdhjgehklvd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlc2huYmx2ZmRoanZnZWhrbHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MjE0NCwiZXhwIjoyMTAwMzU4MTQ0fQ.OR-s7TYXYL2EDgl11A9vNavd-z6UZVG5TvL4tmxDqfY';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlc2huYmx2ZmRoanZnZWhrbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE384NzgyMTQ0LCJleHAiOjIxMDAzNTgxNDR9.8AKDE2oehprL4yYcyKhGBSrX4ovH4OJQkq3paueweE0';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Supabase Helper to Sync Records
async function syncToSupabase(table, record) {
  try {
    const { data, error } = await supabase.from(table).upsert(record);
    if (error) throw error;
    console.log(`⚡ Supabase Cloud DB Synced: [${table}]`);
    return data;
  } catch (err) {
    console.log(`⚡ Supabase Note (${table}): ${err.message}`);
  }
}

// Initialize Database & Firebase Realtime Database Sync
const dbFile = process.env.DB_FILE || 'fuelgo.db';
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://fuelgo-a8e7e-default-rtdb.firebaseio.com/';
let db;

// Firebase Realtime DB Helper (HTTP REST Sync)
async function syncToFirebase(path, data) {
  try {
    const url = `${FIREBASE_DB_URL.replace(/\/$/, '')}/${path}.json`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log(`🔥 Firebase RTDB Synced: /${path}`);
  } catch (err) {
    console.log(`⚠️ Firebase Sync Note: ${err.message}`);
  }
}

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
    google_id TEXT,
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
    delivery_address TEXT,
    delivery_lat REAL DEFAULT 12.9734,
    delivery_lng REAL DEFAULT 79.9328,
    agent_name TEXT DEFAULT 'Ravi Kumar',
    agent_phone TEXT DEFAULT '9876500402',
    agent_lat REAL DEFAULT 12.9760,
    agent_lng REAL DEFAULT 79.9360,
    status TEXT DEFAULT 'confirmed',
    eta_minutes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(station_id) REFERENCES stations(id)
  );
`);

// Column Migrations
try { db.exec("ALTER TABLE users ADD COLUMN google_id TEXT"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT"); } catch(e){}

// Ensure column migrations if database exists
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_lat REAL DEFAULT 12.9734"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN delivery_lng REAL DEFAULT 79.9328"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN agent_name TEXT DEFAULT 'Ravi Kumar'"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN agent_phone TEXT DEFAULT '9876500402'"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN agent_lat REAL DEFAULT 12.9760"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN agent_lng REAL DEFAULT 79.9360"); } catch(e){}

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

// Initial Sync to Firebase Realtime Database
syncToFirebase('status', {
  app: 'FuelGo',
  database: 'Firebase Realtime DB + SQLite',
  rtdb_url: FIREBASE_DB_URL,
  last_online: new Date().toISOString()
});

module.exports = db;
module.exports.syncToFirebase = syncToFirebase;
module.exports.FIREBASE_DB_URL = FIREBASE_DB_URL;
module.exports.supabase = supabase;
module.exports.syncToSupabase = syncToSupabase;
module.exports.SUPABASE_URL = SUPABASE_URL;
