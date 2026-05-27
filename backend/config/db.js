const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : (process.env.DB_PASS || ''),
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'kuwenta_db',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
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
