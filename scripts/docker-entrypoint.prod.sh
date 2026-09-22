#!/usr/bin/env bash
# Production entrypoint: migrate -> seed-if-empty -> build -> start
set -e

echo "==> Проверка prisma в контейнере..."
if [ ! -x ./node_modules/.bin/prisma ]; then
  echo "!! prisma НЕ найден в node_modules/.bin — падаем, чтобы не качать из сети (npx)."
  ls node_modules/.bin 2>/dev/null | head -20 || echo "(нет .bin)"
  exit 1
fi
./node_modules/.bin/prisma --version | head -2

echo "==> Применяем схему БД (Prisma)..."
./node_modules/.bin/prisma db push --skip-generate

echo "==> Сид, только если база пустая..."
./node_modules/.bin/tsx scripts/seed-if-empty.ts

echo "==> Продакшен-сборка Next.js..."
npm run build

echo "==> Запуск на порту 3000..."
exec npm run start
