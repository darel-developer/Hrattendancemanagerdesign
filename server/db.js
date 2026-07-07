const { Pool, types } = require('pg');
const config = require('./config');

// Dates et timestamps retournés en string, pas en Date object
types.setTypeParser(1082, v => v); // date
types.setTypeParser(1114, v => v); // timestamp
types.setTypeParser(1184, v => v); // timestamptz

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  max: config.db.maxConnections,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
});

async function query(sql, params) {
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params || []);
  return [result.rows];
}

module.exports = { query };
