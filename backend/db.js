const mysql = require('mysql2');

// Read configuration from environment variables (for Render / Cloud)
// or fall back to local development database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '@Soumajit2006',
    database: process.env.DB_NAME || 'agrilink_ai',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost')
        ? { rejectUnauthorized: false }
        : undefined
};

// If DATABASE_URL or DB_URL is provided, use it directly
const pool = (process.env.DATABASE_URL || process.env.DB_URL)
    ? mysql.createPool(process.env.DATABASE_URL || process.env.DB_URL)
    : mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        return;
    }
    console.log(`MySQL connected successfully to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
});

module.exports = pool;