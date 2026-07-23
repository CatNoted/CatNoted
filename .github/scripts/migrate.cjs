const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Suppress TLS warning for Supabase self-signed intermediaries
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rawDbUrl = process.env.SUPABASE_DB_URL;
const sqlPath =
  process.env.MIGRATION_SQL_PATH ||
  'supabase/migrations/20260724000000_init_schema.sql';

if (!rawDbUrl) {
  console.error('ERROR: SUPABASE_DB_URL secret is not set.');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

/**
 * Normalise a Supabase connection string so the username matches the host type:
 *   Direct host  (db.<ref>.supabase.co)  --> username = "postgres"
 *   Pooler host  (*.pooler.supabase.com) --> username = "postgres.<ref>"
 * Also strips sslmode/ssl query params that interfere with pg's ssl option.
 */
function normaliseUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    return raw;
  }

  parsed.searchParams.delete('sslmode');
  parsed.searchParams.delete('ssl');
  parsed.searchParams.delete('pgbouncer');
  parsed.searchParams.delete('uselibpqcompat');

  const hostname = parsed.hostname;

  // Direct host: db.<ref>.supabase.co -- MUST use username "postgres"
  const directMatch = hostname.match(/^db\.([^.]+)\.supabase\.co$/i);
  if (directMatch) {
    parsed.username = 'postgres';
    console.log('Detected direct host. Username corrected to: postgres');
    return parsed.toString();
  }

  // Pooler host: *.pooler.supabase.com -- username must be "postgres.<ref>"
  const poolerMatch = hostname.match(/\.pooler\.supabase\.com$/i);
  if (poolerMatch) {
    const userParts = parsed.username.split('.');
    const projectRef = userParts.length >= 2 ? userParts[1] : userParts[0];
    if (projectRef) {
      parsed.username = 'postgres.' + projectRef;
      console.log('Detected pooler host. Username corrected to: postgres.' + projectRef);
    }
    return parsed.toString();
  }

  console.log('Using connection URL as-is for host: ' + hostname);
  return parsed.toString();
}

const connectionString = normaliseUrl(rawDbUrl);

let hostname = '';
try {
  hostname = new URL(connectionString).hostname;
} catch (_) {}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    ...(hostname ? { servername: hostname } : {}),
  },
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to database.');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
