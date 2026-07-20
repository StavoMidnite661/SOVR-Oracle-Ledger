// Test database connection
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

console.log('Testing database connection...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

try {
  // Create PostgreSQL connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('✓ Pool created');

  // Test connection
  const client = await pool.connect();
  console.log('✓ Database connected');

  // Test a simple query
  const result = await client.query('SELECT 1 as test');
  console.log('✓ Query executed:', result.rows[0]);

  client.release();
  await pool.end();

  console.log('✅ Database connection OK');
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}