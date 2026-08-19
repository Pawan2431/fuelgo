const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'fuelgo.db');
const db = new Database(dbPath);

try {
  const stmt = db.prepare('UPDATE merchant_config SET merchant_name = ?, merchant_upi_id = ? WHERE id = 1');
  const result = stmt.run('Food Court', '7989154858-1@okbizaxis');
  
  if (result.changes === 0) {
    // Insert if it doesn't exist
    const insertStmt = db.prepare('INSERT INTO merchant_config (id, merchant_name, merchant_upi_id) VALUES (1, ?, ?)');
    insertStmt.run('Food Court', '7989154858-1@okbizaxis');
    console.log("Inserted new merchant config.");
  } else {
    console.log("Updated existing merchant config.");
  }
} catch (error) {
  console.error("Error updating merchant config:", error);
} finally {
  db.close();
}
