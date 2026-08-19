const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('fuelgo.db');

const email = 'pullagurapawanteja08@gmail.com';
const phone = '7989154858';
const password = 'Admin@123';
const name = 'Admin Pawan';
const role = 'super_admin';

// Check if user already exists
let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

if (user) {
    // Update password
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    console.log(`Updated user ${email} with new password.`);
} else {
    // Insert new user
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    `).run(name, email, phone, hash, role);
    console.log(`Created new user ${email}.`);
}
