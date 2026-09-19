// Генерирует vps-setup.txt — блок команд для вставки в веб-консоль Timeweb.
// Реальные ключи читаются из .env и пишутся в файл на диске (в stdout не выводятся).
const fs = require('fs');
const crypto = require('crypto');

const envRaw = fs.readFileSync('.env', 'utf8');
function getVar(name) {
  const lines = envRaw.split('\n');
  for (const l of lines) {
    if (l.startsWith(name + '=')) {
      let v = l.slice(name.length + 1).trim();
      v = v.replace(/^"*/, '').replace(/"*/, '').replace(/^"+|"+$/g, '');
      return v;
    }
  }
  return '';
}

const abacus = getVar('ABACUS_API_KEY');
const serper = getVar('SERPER_API_KEY');
if (!abacus || !serper) {
  console.error('Missing ABACUS_API_KEY or SERPER_API_KEY in .env');
  process.exit(1);
}

const dbPass = crypto.randomBytes(12).toString('base64url');
const authSecret = crypto.randomBytes(24).toString('base64');

const setup = `# === UniCompetency: установка на VPS (вставить БЛОКАМИ в веб-консоль Timeweb) ===
# Блок 1: установка Docker и git (~2 минуты)
apt-get update && apt-get install -y git curl ca-certificates && curl -fsSL https://get.docker.com | sh

# Блок 2: клонирование проекта
git clone https://github.com/VadimStre/utc-web-app /opt/utc && cd /opt/utc

# Блок 3: конфигурация (файл .env.prod)
cat > .env.prod <<'EOF'
DB_PASSWORD=${dbPass}
NEXTAUTH_SECRET=${authSecret}
NEXTAUTH_URL=http://5.42.106.111:3000
ABACUS_API_KEY=${abacus}
ABACUS_API_BASE_URL=https://routellm.abacus.ai/v1
ABACUS_MODEL=route-llm
SERPER_API_KEY=${serper}
EOF

# Блок 4: запуск (сборка образа ~3-6 минут, потом старт)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Блок 5 (после 3-4 минут): проверка статуса
docker compose -f docker-compose.prod.yml ps
docker logs utc_app --tail 20
`;

fs.writeFileSync('vps-setup.txt', setup);
console.log('OK: vps-setup.txt written (keys embedded, not shown here)');
