const sqlite3 = require('sqlite3').verbose();

// Connect to a persistent database file
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            address TEXT,
            mobile_no TEXT,
            password TEXT NOT NULL,
            fcmToken TEXT
        )
    `);

    // Create contacts table with an added email field
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            created_by INTEGER,
            name TEXT NOT NULL,
            phoneNumber TEXT,
            email TEXT NOT NULL,
            relationship TEXT NOT NULL,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);
});

module.exports = db;
