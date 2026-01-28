const { pool } = require('./db');

async function migrate() {
  try {
    console.log('Adding missing columns to documents table...');
    
    // Check if columns exist before adding
    const columns = [
      { name: 'filename', type: 'VARCHAR(255)' },
      { name: 'subject', type: 'VARCHAR(255)' },
      { name: 'sender', type: 'VARCHAR(255)' },
      { name: 'received_at', type: 'TIMESTAMP' }
    ];

    for (const col of columns) {
      await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='${col.name}') THEN
            ALTER TABLE documents ADD COLUMN ${col.name} ${col.type};
          END IF;
        END $$;
      `);
      console.log(`Column ${col.name} checked/added.`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
