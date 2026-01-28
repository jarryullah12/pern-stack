
const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Checking database columns...');
    
    // Check if filename exists
    const checkFilename = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='filename';
    `);
    
    if (checkFilename.rows.length === 0) {
      console.log('Adding column filename to documents table...');
      await pool.query('ALTER TABLE documents ADD COLUMN filename TEXT;');
    } else {
      console.log('Column filename already exists.');
    }

    // Check if file_path exists
    const checkFilePath = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='documents' AND column_name='file_path';
    `);
    
    if (checkFilePath.rows.length === 0) {
      console.log('Adding column file_path to documents table...');
      await pool.query('ALTER TABLE documents ADD COLUMN file_path TEXT;');
    } else {
      console.log('Column file_path already exists.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
