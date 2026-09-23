# Интерфейсы

Читается каждым исполнителем до начала работы. Не изобретай заново то, что здесь есть.

## Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| GitHub repo | исходники, ветка main | https://github.com/VadimStre/utc-web-app | секреты (в .gitignore) |
| Render Web Service | деплой, env, домен | https://<service>.onrender.com | ключи в env |
| Render Postgres | данные | Internal Connection String | пароль БД |
| DB init | схема + сид | `npx prisma db push` + `npx tsx scripts/seed-if-empty.ts` | — |

## Общие правила проекта

- Стек: Next.js 14 (App Router), Prisma 6 + PostgreSQL, NextAuth, TypeScript, tsx для скриптов.
- Команды: `npm install` / `npm run build` / `npm run start` / `npx prisma db push` / `npx tsx scripts/seed-if-empty.ts`.
- Провайдер LLM: Abacus.ai RouteLLM — `ABACUS_API_BASE_URL=https://routellm.abacus.ai/v1`, `ABACUS_MODEL=route-llm`.
- Секреты: значения живут только в локальном `.env` (не в git, не в чат). Имена переменных — в `.env.example`.
- Состояние Render управляется: (1) Render REST API — предпочтительно; (2) если API недоступен с этой машины — через браузер-панель.
- Что менять запрещено: ветку main (деплой с неё), схему Prisma без D##-записи, `.env` (не коммитить).
- Если не хватает зависимости/доступа — вернуть `BLOCKED` с названием, не изобретать обход.

## Из таска 02 — деплой Render

- Публичный URL сервиса: `https://<имя>.onrender.com` (имя выбирается так, чтобы было доступно).
- Render API: `Authorization: Bearer <RENDER_API_KEY>` (ключ в Dashboard → Account Settings → API Keys).
- Создание Postgres: `POST https://api.render.com/v1/postgres` (plan free, region oregon).
- Создание Web Service: `POST https://api.render.com/v1/services` (type web_service, repo, env, serviceDetails: build/start).
- Env vars: задаются через API (секреты — в зашифрованном виде в панели) или через браузер.
- Миграция/сид: Shell-команда Render (или эквивалент) `npx prisma db push && npx tsx scripts/seed-if-empty.ts`; можно объединить в start-команду, если это безопасно.
- Проверка: GET/HEAD к https://<service>.onrender.com → 200/302 и страница логина.
