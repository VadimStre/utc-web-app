#!/bin/sh
# Проверка node_modules внутри контейнера utc_app
echo "=== 1. ls node_modules/.bin (prisma/tsx) ==="
docker exec utc_app sh -c 'ls /app/node_modules/.bin 2>/dev/null | grep -E "prisma|tsx"' 2>&1

echo ""
echo "=== 2. npm ls prisma ==="
docker exec utc_app sh -c 'cd /app && npm ls prisma --depth=0 2>&1 | head -10' 2>&1

echo ""
echo "=== 3. Есть ли вообще node_modules? ==="
docker exec utc_app sh -c 'ls /app/node_modules 2>/dev/null | wc -l' 2>&1

echo ""
echo "=== 4. Версия prisma в lock (нужна для сравнения) ==="
docker exec utc_app sh -c 'grep -A2 "node_modules/prisma" /app/package-lock.json 2>/dev/null | head -5' 2>&1

echo ""
echo "=== 5. Dockerfile-сборка: был ли npm ci успешным? (смотрим на слой 6 в хосте) ==="
docker exec utc_app sh -c 'cd /app && ls -la | head -15' 2>&1
