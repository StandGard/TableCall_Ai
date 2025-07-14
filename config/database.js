const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  // Production: Use DATABASE_URL if available (Render/Railway/Heroku style)
  connectionString: process.env.DATABASE_URL,
  
  // Development: Use individual environment variables
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tabletalk_ai',
  user: process.env.DB_USER || 'tabletalk_user',
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to try connecting before timing out
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Use connection string if available (production), otherwise use individual params
const poolConfig = process.env.DATABASE_URL ? 
  { connectionString: process.env.DATABASE_URL, ssl: dbConfig.ssl } : 
  dbConfig;

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
    console.log('Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
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