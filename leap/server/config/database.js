const mysql = require('mysql2/promise');
require('dotenv').config({ path: './env' });

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'leap_user',
  password: process.env.DB_PASSWORD || 'Zs19981030.',
  database: process.env.DB_NAME || 'leap_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connection successful');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
  }
}

module.exports = {
  pool,
  testConnection
}; 