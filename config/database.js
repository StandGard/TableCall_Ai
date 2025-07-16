const { Pool } = require('pg');
require('dotenv').config();

// Create pool configuration
let poolConfig;

if (process.env.DATABASE_URL) {
  // Production: Use DATABASE_URL (Railway, Render, Heroku style)
  console.log('🔗 Using DATABASE_URL for production database connection');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for most cloud databases
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  // Development: Use individual environment variables
  console.log('🏠 Using local database configuration');
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tabletalk_ai',
    user: process.env.DB_USER || 'tabletalk_user',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false
  };
}

// Create connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  testConnection
}; 