
const { Pool } = require('pg');

/**
 * Database connection pool configuration for SpeditionDB
 * Updated with user-provided credentials
 */
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'SpeditionDB',
  password: process.env.DB_PASSWORD || '123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

module.exports = { pool };
