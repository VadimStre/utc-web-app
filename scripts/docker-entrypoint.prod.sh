#!/usr/bin/env bash
# Production entrypoint: migrate -> seed-if-empty -> build -> start
set -e

echo "==> Применяем схему БД (Prisma)..."
./node_modules/.bin/prisma db push --skip-generate

echo "==> Сид, только если база пустая..."
./node_modules/.bin/tsx scripts/seed-if-empty.ts

echo "==> Продакшен-сборка Next.js..."
npm run build

echo "==> Запуск на порту 3000..."
exec npm run start
