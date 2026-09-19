#!/usr/bin/env bash
# Production entrypoint: migrate -> seed-if-empty -> build -> start
set -e

echo "==> Применяем схему БД (Prisma)..."
npx prisma db push

echo "==> Сид, только если база пустая..."
npx tsx scripts/seed-if-empty.ts

echo "==> Продакшен-сборка Next.js..."
npm run build

echo "==> Запуск на порту 3000..."
exec npm run start
