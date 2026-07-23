const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Disable strict TLS authorization check for self-signed certificates in poolers/proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rawDbUrl = process.env.SUPABASE_DB_URL;
const sqlPath = process.env.MIGRATION_SQL_PATH || 'supabase/migrations/20260724000000_init_schema.sql';

if (!rawDbUrl) {
  console.error('Missing SUPABASE_DB_URL secret');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

let hostname = '';
let cleanedDbUrl = rawDbUrl;

try {
  const parsedUrl = new URL(rawDbUrl);
  hostname = parsedUrl.hostname;
  // Remove sslmode params to prevent pg-connection-string from overriding rejectUnauthorized
  parsedUrl.searchParams.delete('sslmode');
  parsedUrl.searchParams.delete('ssl');
  cleanedDbUrl = parsedUrl.toString();
} catch (e) {
  // Fallback if rawDbUrl is not standard URL
}

const client = new Client({
  connectionString: cleanedDbUrl,
  ssl: {
    rejectUnauthorized: false,
    ...(hostname ? { servername: hostname } : {}),
  },
});

(async () => {
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('migration applied successfully');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
