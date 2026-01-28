
const { pool } = require('./db');

async function checkDocs() {
  try {
    const result = await pool.query('SELECT id, reference, type, filename, file_path FROM documents ORDER BY created_at DESC LIMIT 5');
    console.log('Latest documents:');
    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

checkDocs();
