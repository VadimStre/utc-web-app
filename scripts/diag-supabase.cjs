// Диагностика подключения к Supabase (парсит .env, выводит только маскированную инфу)
const fs = require('fs');
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envLine = fs.readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
if (!envLine) { console.log('no DATABASE_URL'); process.exit(1); }
const v = envLine.replace(/^DATABASE_URL="?/, '').replace(/"?\s*$/, '');
const m = v.match(/^(postgresql|postgres):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/);
if (!m) { console.log('cannot parse:', v.slice(0, 50)); process.exit(1); }

const [, scheme, user, pass, host, port, db, query] = m;
console.log('current: user=' + user + ' host=' + host + ' port=' + port + ' db=' + db);
console.log('pass len:', pass.length);

const candidates = [
  { label: 'as-is', url: scheme + '://' + user + ':' + pass + '@' + host + ':' + port + '/' + db + (query || '') },
  { label: 'user=postgres', url: scheme + '://postgres:' + pass + '@' + host + ':' + port + '/' + db + (query || '') },
  { label: 'sni-host=<ref>.pooler', url: scheme + '://postgres.' + 'prpqimbvakzmcgbilllb' + ':' + pass + '@prpqimbvakzmcgbilllb.pooler.supabase.com:6543/' + db },
  { label: 'host=<ref>.supabase.co:5432', url: scheme + '://postgres:' + pass + '@prpqimbvakzmcgbilllb.supabase.co:5432/' + db },
];

(async () => {
  for (const cand of candidates) {
    const c = new Client({ connectionString: cand.url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await c.connect();
      const r = await c.query('SELECT 1');
      console.log('OK   [' + cand.label + ']', r.rows[0]);
      await c.end();
      break; // нашли рабочий
    } catch (e) {
      console.log('FAIL [' + cand.label + ']', (e.code || ''), e.message.slice(0, 70));
    }
  }
})();
