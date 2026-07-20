import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:sovr@localhost:5432/postgres'
});

async function cleanup() {
  try {
    // Delete the test employee
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING id', ['EMP-1777910131071']);
    console.log(`✅ Removed test employee: ${result.rowCount} rows deleted`);

    // Check remaining employees
    const employees = await pool.query('SELECT id, name, bank_routing_number FROM employees ORDER BY created_at DESC');
    console.log('\nCurrent employees:');
    employees.rows.forEach(r => console.log(`  - ${r.id}: ${r.name}`));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanup();