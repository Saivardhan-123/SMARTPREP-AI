const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function initializeDatabase() {
    try {
        // Create database connection
        db = await open({
            filename: path.join(__dirname, 'smartprep.db'),
            driver: sqlite3.Database
        });

        console.log('📊 Connected to SQLite database');

        // Create users table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT,
                is_active INTEGER DEFAULT 1
            )
        `);

        console.log('✅ Database tables initialized');
        return db;

    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

async function getDatabase() {
    if (!db) {
        await initializeDatabase();
    }
    return db;
}

module.exports = {
    initializeDatabase,
    getDatabase
};
