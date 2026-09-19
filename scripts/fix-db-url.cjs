const fs = require('fs');
const p = '.env';
let lines = fs.readFileSync(p, 'utf8').split('\n');
let idx = lines.findIndex((l) => l.startsWith('DATABASE_URL='));
if (idx === -1) { console.error('not found'); process.exit(1); }
const raw = lines[idx];
// ПРОСТО: возьмём строку целиком и вырежем всё до конца, убрав по пути артефакт — двойной кавычки между postgres и ?sslmode
// Фактически значение = то, что между ВНЕШНИМИ кавычками (первой и последней), но в значении ЕСТЬ ещё одна кавычка 
// перед ?sslmode=require — снимем и её.
let val = raw;
val = val.replace(/^DATABASE_URL="?/, '');  // снять префикс и первую кавычку
val = val.replace(/"+$/, '');                // снять последнюю кавычку
// Убрать артефактную кавычку перед query (если есть)
val = val.replace(/"(\?sslmode=require)/, '$1');
// Собрать обратно
lines[idx] = 'DATABASE_URL="' + val + '"';
fs.writeFileSync(p, lines.join('\n'));
console.log('fixed');
