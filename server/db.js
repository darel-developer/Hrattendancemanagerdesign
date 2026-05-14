const { Pool, types } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Dates et timestamps retournés en string, pas en Date object
types.setTypeParser(1082, v => v); // date
types.setTypeParser(1114, v => v); // timestamp
types.setTypeParser(1184, v => v); // timestamptz

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_attendance_db',
  max: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function query(sql, params) {
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params || []);
  return [result.rows];
}

module.exports = { query };
