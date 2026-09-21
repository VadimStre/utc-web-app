const fs = require('fs');
const s = fs.readFileSync('vps-setup.txt', 'utf8');
const m = s.match(/cat > \.env\.prod <<'EOF'\n([\s\S]*?)\nEOF/);
if (!m) { console.error('no block'); process.exit(1); }
const lines = m[1].split('\n').filter((l) => l.includes('='));
let out = '# ВСТАВЛЯТЬ ПО ОДНОЙ СТРОКЕ (каждая + Enter):\n';
out += 'cd /opt/utc\n';
lines.forEach((l, i) => {
  out += 'echo ' + l + (i === 0 ? ' > .env.prod' : ' >> .env.prod') + '\n';
});
out += 'cat .env.prod\n';
out += 'docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build\n';
fs.writeFileSync('vps-commands.txt', out);
console.log('OK: vps-commands.txt создан, строк команд:', lines.length + 3);
