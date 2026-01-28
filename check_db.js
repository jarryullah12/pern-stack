const { pool } = require('./db');
pool.query("SELECT count(*) FROM documents")
    .then(res => {
        console.log('Total documents:', res.rows[0].count);
        return pool.query("SELECT DISTINCT uploaded_by FROM documents");
    })
    .then(res => {
        console.log('Sources:', res.rows.map(r => r.uploaded_by));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });