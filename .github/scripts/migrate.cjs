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

function getCandidateUrls(inputUrl) {
  const candidates = [];
  try {
    const url1 = new URL(inputUrl);
    url1.searchParams.delete('sslmode');
    url1.searchParams.delete('ssl');
    
    // Extract project reference
    let projectRef = '';
    const hostParts = url1.hostname.split('.');
    if (url1.hostname.startsWith('db.') && hostParts.length >= 3) {
      projectRef = hostParts[1];
    } else if (url1.username.includes('.')) {
      projectRef = url1.username.split('.')[1];
    }

    // Direct DB connection host (db.<ref>.supabase.co) requires username 'postgres'
    if (url1.hostname.startsWith('db.')) {
      const directUrl = new URL(url1.toString());
      directUrl.username = 'postgres';
      candidates.push(directUrl);
    }

    // Pooler connection host (*.pooler.supabase.com) requires username 'postgres.<ref>'
    if (projectRef) {
      const poolerUrl = new URL(url1.toString());
      poolerUrl.username = `postgres.${projectRef}`;
      candidates.push(poolerUrl);
    }

    // Include raw parsed URL as fallback candidate
    candidates.push(url1);

  } catch (e) {
    return [{ toString: () => inputUrl, hostname: '' }];
  }
  return candidates;
}

(async () => {
  const candidates = getCandidateUrls(rawDbUrl);
  let lastError = null;
  let client = null;

  for (const candidate of candidates) {
    const connStr = candidate.toString();
    const hostname = candidate.hostname || '';
    
    const testClient = new Client({
      connectionString: connStr,
      ssl: {
        rejectUnauthorized: false,
        ...(hostname ? { servername: hostname } : {}),
      },
    });

    try {
      await testClient.connect();
      client = testClient;
      lastError = null;
      break; // Successfully connected!
    } catch (err) {
      lastError = err;
      await testClient.end().catch(() => {});
    }
  }

  if (!client || lastError) {
    console.error('migration failed:', lastError ? (lastError.message || lastError) : 'Unable to connect to database');
    process.exit(1);
  }

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('migration applied successfully');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('migration execution failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
