# Диагностика состояния репозитория и Docker на сервере
# Запускать в веб-консоли Timeweb: bash /opt/utc/check.sh
cd /opt/utc

echo "=== 1. Текущий коммит ==="
git log --oneline -3 2>&1

echo ""
echo "=== 2. Статус (не закоммичено?) ==="
git status --short 2>&1 | head -10

echo ""
echo "=== 3. package.json: prisma/tsx в dependencies? ==="
node -e "const p=require('./package.json'); console.log('deps.prisma:', p.dependencies.prisma); console.log('deps.tsx:', p.dependencies.tsx);" 2>&1

echo ""
echo "=== 4. entrypoint: --skip-generate? ==="
grep -n "skip-generate" scripts/docker-entrypoint.prod.sh 2>&1

echo ""
echo "=== 5. Dockerfile.prod: зеркало? ==="
grep -n "npmmirror\|registry" Dockerfile.prod 2>&1

echo ""
echo "=== 6. Контейнеры ==="
docker ps -a --format '{{.Names}} | {{.Status}}' 2>&1

echo ""
echo "=== 7. Порт 3000 в контейнере ==="
docker exec utc_app sh -c "ss -tlnp 2>/dev/null | grep :3000 || echo 'NOT LISTENING'" 2>&1

echo ""
echo "=== 8. Свежие логи app (40 строк) ==="
docker logs utc_app --tail 40 2>&1
