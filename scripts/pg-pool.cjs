// Дисциплина соединений для Neon: pg-pool с короткими соединениями (обход ECONNRESET от Neon pooler)
// Использование: используй в API-роутах вместо нового Client каждый раз
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

// Загрузка из .env вручную (dotenv.config() не вызывается автоматически в this module)
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath) && !process.env.DATABASE_URL) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const mLine = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (mLine && !process.env[mLine[1]]) {
        process.env[mLine[1]] = mLine[2];
      }
    }
  }
}

function getPool() {
  loadEnv();
  if (pool) return pool;
  const orig = process.env.DATABASE_URL || '';
  console.log('orig host now:', orig.match(/@([^\/]+)/)?.[1]);
  // Ручной разбор URL (без regex)
  const idx = orig.indexOf('://');
  const scheme = orig.slice(0, idx);
  const rest = orig.slice(idx + 3);
  const at = rest.lastIndexOf('@');
  const creds = rest.slice(0, at);
  const hostAndDb = rest.slice(at + 1);
  const colon = creds.indexOf(':');
  const user = creds.slice(0, colon);
  const pass = creds.slice(colon + 1);
  // Direct: убираем -pooler из хоста
  const hostAndDbClean = hostAndDb.replace('-pooler', '').replace(/[&?]channel_binding=require/g, '');
  const direct = scheme + '://' + user + ':' + encodeURIComponent(pass) + '@' + hostAndDbClean;
  console.log('direct host:', direct.match(/@([^\/]+)/)?.[1]);
  pool = new Pool({
    connectionString: direct,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  });
  return pool;
}

async function q(sql, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

module.exports = { getPool, q };
