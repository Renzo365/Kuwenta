const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : (process.env.MYSQLPASSWORD || ''),
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'kuwenta_db',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log(`Configuring database connection pool for: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

module.exports = {
  pool,
  query
};
