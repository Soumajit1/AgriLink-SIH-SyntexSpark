const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Read DB credentials from environment or default
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

console.log('----------------------------------------------------');
console.log('AgriLink AI - Automated Database Initializer');
console.log('----------------------------------------------------');
console.log(`Connecting to MySQL at ${dbConfig.host} as user '${dbConfig.user}'...`);

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('❌ Failed to connect to MySQL:', err.message);
        console.error('Please make sure MySQL is running (e.g. via XAMPP, WAMP, or Windows Service).');
        process.exit(1);
    }

    console.log('✅ Connected to MySQL successfully!');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.error('❌ database/schema.sql not found at:', schemaPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Importing database schema and sample data...');

    connection.query(sql, (importErr) => {
        if (importErr) {
            console.error('❌ Error executing database/schema.sql:', importErr.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ Database `agrilink_ai` created and all 12 tables populated successfully!');
        console.log('----------------------------------------------------');
        console.log('You can now start the server with: npm start');
        console.log('----------------------------------------------------');
        connection.end();
        process.exit(0);
    });
});
