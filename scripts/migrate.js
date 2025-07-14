require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tabletalk_ai',
  user: process.env.DB_USER || 'tabletalk_user',
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(dbConfig);

async function runMigration() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection established');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Running schema migration...');
    
    // Execute schema
    await client.query(schema);
    
    console.log('✅ Schema migration completed successfully');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Created tables:', tables);
    
    // Verify indexes were created
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename IN ('contact_submissions', 'demo_calls')
    `);
    
    const indexes = indexesResult.rows.map(row => row.indexname);
    console.log('🔍 Created indexes:', indexes);
    
    client.release();
    
    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Tables created: ${tables.length}`);
    console.log(`   - Indexes created: ${indexes.length}`);
    console.log('   - Triggers: data_retention_date trigger');
    console.log('   - Functions: update_data_retention_date()');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure PostgreSQL is running');
    console.error('   2. Check database credentials in .env file');
    console.error('   3. Verify database exists and user has permissions');
    console.error('   4. Check network connectivity to database');
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Add some demo data if requested
async function addDemoData() {
  console.log('\n🎭 Adding demo data...');
  
  try {
    const client = await pool.connect();
    
    const demoContacts = [
      {
        name: 'Mario Rossi',
        email: 'mario@pizzaroma.co.uk',
        restaurant_name: 'Pizza Roma',
        phone: '+44 7123 456789',
        wants_trial: true,
        status: 'new',
        lead_source: 'website_contact_form',
        consent_given: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@thegardenbistro.co.uk',
        restaurant_name: 'The Garden Bistro',
        phone: '+44 7987 654321',
        wants_trial: false,
        status: 'contacted',
        lead_source: 'website_contact_form',
        consent_given: true
      },
      {
        name: 'James Wilson',
        email: 'james@spiceoflife.co.uk',
        restaurant_name: 'Spice of Life Indian Restaurant',
        phone: '+44 7555 123456',
        wants_trial: true,
        status: 'converted',
        lead_source: 'website_contact_form',
        consent_given: true
      }
    ];
    
    for (const contact of demoContacts) {
      await client.query(`
        INSERT INTO contact_submissions 
        (name, email, restaurant_name, phone, wants_trial, status, lead_source, consent_given)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        contact.name,
        contact.email,
        contact.restaurant_name,
        contact.phone,
        contact.wants_trial,
        contact.status,
        contact.lead_source,
        contact.consent_given
      ]);
    }
    
    console.log(`✅ Added ${demoContacts.length} demo contact submissions`);
    client.release();
    
  } catch (error) {
    console.error('❌ Failed to add demo data:', error);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const includeDemoData = args.includes('--demo') || args.includes('-d');
  
  console.log('🏗️  TableTalk AI Database Migration Tool');
  console.log('=========================================\n');
  
  await runMigration();
  
  if (includeDemoData) {
    await addDemoData();
  }
  
  console.log('\n🚀 Migration complete! You can now start the server.');
  console.log('   npm start       - Start production server');
  console.log('   npm run dev     - Start development server');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runMigration, addDemoData }; 