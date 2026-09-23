<!-- autopilot:start -->
# База данных УТК (utc-web-app)

Веб-система для учёта уникальных технологических компетенций (УТК): Next.js 14 (App Router), Prisma + PostgreSQL, NextAuth (email + пароль), AI-мастер ввода через Abacus.ai RouteLLM, поиск аналогов через Tavily/Serper.

## Команды

| Команда | Что делает |
|---------|------------|
| `npm install` | Установить зависимости |
| `npm run dev` | Запустить локально (http://localhost:3000) |
| `npm run build` | Продакшен-сборка |
| `npm run start` | Запустить собранное |
| `npx prisma db push` | Применить схему БД (без миграций) |
| `npx tsx scripts/seed-if-empty.ts` | Сид: админ + настройки + демо-данные (только если БД пуста) |

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Правило: требование из `manifest.md`
может снять только пользователь.

Если работа продолжается — скажи «продолжи автопилот»: состояние поднимется
из `.autopilot/state.js`, переспрашивать ничего не нужно.
<!-- autopilot:end -->
