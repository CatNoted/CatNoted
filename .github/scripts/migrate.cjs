const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL;
const sqlPath = process.env.MIGRATION_SQL_PATH || 'supabase/migrations/20260724000000_init_schema.sql';

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL secret');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

let hostname = '';
try {
  const parsedUrl = new URL(dbUrl);
  hostname = parsedUrl.hostname;
} catch (e) {
  // Fallback if dbUrl is not standard URL
}

const client = new Client({
  connectionString: dbUrl,
  ssl: hostname ? {
    rejectUnauthorized: false,
    servername: hostname,
  } : {
    rejectUnauthorized: false,
  },
});

(async () => {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('migration applied');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
