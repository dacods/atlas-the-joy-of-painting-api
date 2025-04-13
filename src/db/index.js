const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '677620Dl',
  database: process.env.DB_NAME || 'joy_of_painting',
});

module.exports = {
  query: async (text, params) => {
    return await pool.query(text, params);
  }
};