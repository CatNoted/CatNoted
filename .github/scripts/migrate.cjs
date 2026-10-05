const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { Client } = require('pg');

const rawDbUrl = process.env.SUPABASE_DB_URL;
const sqlPath =
  process.env.MIGRATION_SQL_PATH ||
  'supabase/migrations/20260724000000_init_schema.sql';

if (!rawDbUrl) {
  console.error('ERROR: SUPABASE_DB_URL secret is not set.');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

// We bypass the Node.js DNS resolution subsystem by resolving the pooler IPv4
// address dynamically and passing it directly as the connection options' host,
// while passing the direct hostname as the TLS servername SNI.
(async () => {
  let client;
  try {
    let targetHost = '';
    try {
      const parsedRaw = new URL(rawDbUrl);
      targetHost = parsedRaw.hostname;
    } catch (_) {}
    let poolerIp = targetHost; // Fallback to hostname for dns resolution if pooler IP is unknown



    let normalisedUrl = rawDbUrl;
    // Delete query params that interfere
    try {
      const parsedUrl = new URL(rawDbUrl);
      parsedUrl.searchParams.delete('sslmode');
      parsedUrl.searchParams.delete('ssl');
      parsedUrl.searchParams.delete('pgbouncer');
      parsedUrl.searchParams.delete('uselibpqcompat');
      normalisedUrl = parsedUrl.toString();
    } catch (_) {}

    const parsedUrl = new URL(normalisedUrl);
    client = new Client({
      host: poolerIp,
      port: 6543,
      user: 'postgres', // direct host username is postgres
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.slice(1) || 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: targetHost,
      },
    });

    await client.connect();
    console.log('Connected to database.');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    if (client) {
      await client.end().catch(() => {});
    }
  }
})();
