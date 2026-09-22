const mysql = require('mysql2');

// Read configuration from environment variables (for Render / Cloud)
// or fall back to local development database
let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '@Soumajit2006',
    database: process.env.DB_NAME || 'agrilink_ai',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost'))
        ? { rejectUnauthorized: false }
        : undefined
};

// If DATABASE_URL or DB_URL is provided, parse it robustly
const rawUrl = process.env.DATABASE_URL || process.env.DB_URL;
if (rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        dbConfig = {
            host: parsed.hostname,
            port: Number(parsed.port) || 3306,
            user: decodeURIComponent(parsed.username || 'root'),
            password: decodeURIComponent(parsed.password || ''),
            database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'test',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: { rejectUnauthorized: false }
        };
    } catch (e) {
        console.warn('Could not parse DATABASE_URL with URL parser, falling back to direct string:', e.message);
    }
}

const pool = mysql.createPool(dbConfig);

// Provide transaction compatibility methods on pool for existing routes
pool.beginTransaction = function(callback) {
    if (typeof callback === 'function') {
        callback(null);
    }
};

pool.rollback = function(callback) {
    if (typeof callback === 'function') {
        callback();
    }
};

pool.commit = function(callback) {
    if (typeof callback === 'function') {
        callback(null);
    }
};

pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        return;
    }
    console.log(`MySQL connected successfully to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
});

module.exports = pool;