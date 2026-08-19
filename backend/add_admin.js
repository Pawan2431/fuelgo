const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('fuelgo.db');

const phone = '7989154858';
const password = 'Test@1234'; 
const email = 'pullagurapawanteja@gmail.com';
const name = 'Admin Pawan';

const hash = bcrypt.hashSync(password, 10);

const existingUser = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone, email);

if (existingUser) {
  db.prepare('UPDATE users SET password_hash = ?, phone = ?, email = ? WHERE id = ?').run(hash, phone, email, existingUser.id);
  console.log('User updated successfully. Phone:', phone, 'Email:', email, 'Password:', password);
} else {
  db.prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(name, email, phone, hash, 'b2b_fleet');
  console.log('User inserted successfully. Phone:', phone, 'Email:', email, 'Password:', password);
}
