// Переключение DATABASE_URL с Neon на Supabase (учитывая, что пароль может содержать спецсимволы, кавычки снимаем аккуратно)
const fs = require('fs');
const p = '.env';
let lines = fs.readFileSync(p, 'utf8').split('\n');
let idx = lines.findIndex((l) => l.startsWith('DATABASE_URL='));
if (idx === -1) { console.error('DATABASE_URL not found'); process.exit(1); }
// Снимаем ВСЕ кавычки и добиваем пробелы
let raw = lines[idx].replace(/^DATABASE_URL=/, '').trim();
raw = raw.replace(/^"+|"+$/g, ''); // снять внешние кавычки (если пароль содержит кавычки внутри — оставим как есть)
// Парсим
const m = raw.match(/^(postgresql|postgres):\/\/([^:]+):([^@]+)@([^:\/]+)(:\d+)?\/([^?]+)(\?.*)?$/);
if (!m) { console.error('cannot parse:', raw.slice(0, 40)); process.exit(1); }
const scheme = m[1];
const pass = m[3];
const newUser = 'postgres.prpqimbvakzmcgbilllb';
const newHost = 'aws-0-eu-central-1.pooler.supabase.com';
const newPort = ':6543';
const newDb = m[6];
let query = m[7] || '';
if (!query.includes('sslmode=require')) {
  query = (query ? '&' : '?') + 'sslmode=require';
}
const newUrl = scheme + '://' + newUser + ':' + pass + '@' + newHost + newPort + '/' + newDb + query;
lines[idx] = 'DATABASE_URL="' + newUrl + '"';
fs.writeFileSync(p, lines.join('\n'));
console.log('ok — хост:', newHost, '| user:', newUser, '| пароль сохранён');
