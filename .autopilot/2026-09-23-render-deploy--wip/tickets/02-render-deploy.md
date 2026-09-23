# 02 — Деплой на Render.com и проверка по HTTPS

**Требования:** R01, R02, R03, R04, R05, R06, R07, R08i, R09i
**Blocked by:** 01
**Зона:** Render-панель (вне репозитория) + `.env` локально + `render.yaml` (если нужен)
**Волна:** 2
**Status:** ready

## Что должно заработать

Проект utc-web-app развёрнут на Render.com: подключён GitHub-репозиторий (ветка main), создан управляемый PostgreSQL, заданы переменные окружения (значения — из локального .env, в чат/git не попадают), в БД применена схема и выполнен сид (админ admin@utc.local), сервис задеплоен и отвечает по HTTPS.

## Из брифа, дословно

> «Разверни проект utc-web-app на Render.com: подключи GitHub-репозиторий, создай PostgreSQL, настрой переменные окружения, выполни миграцию БД и сид, деплой, проверь доступность по HTTPS»
> «Переменные окружения (значения — из .env локально, НЕ в чат)»
> «выполнить npx prisma db push && npx tsx scripts/seed-if-empty.ts перед стартом»

## Разделы спецификации

Истории 1–9, Решения §1–§6, Швы §1.

## Важное из «паспорта проекта» (предыдущий сеанс)

- Репозиторий: https://github.com/VadimStre/utc-web-app (public, ветка main), коммит 241c2d1 — Render-ready.
- Render: Web Service из этого репозитория; Build: `npm install && npm run build`; Start: `npm run start`; PostgreSQL (Internal URL).
- Переменные (значения из .env локально): `DATABASE_URL` (внутренняя строка Render Postgres), `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://<service>.onrender.com`, `ABACUS_API_KEY`, `ABACUS_API_BASE_URL=https://routellm.abacus.ai/v1`, `ABACUS_MODEL=route-llm`, `SERPER_API_KEY`.
- После деплоя перед стартом: `npx prisma db push` и сид вручную/командой деплоя (см. Критерии).
- Вход в систему: admin@utc.local / [REDACTED:ADMIN_SEED_PASSWORD] (зашит в scripts/seed-if-empty.ts).

## Критерии приёмки

- [ ] Web Service на Render создан из репозитория VadimStre/utc-web-app, ветка main
- [ ] PostgreSQL instance создан, статус available, дата создания сегодня
- [ ] Env vars сервиса содержат: DATABASE_URL (внутренняя), NEXTAUTH_SECRET, NEXTAUTH_URL, ABACUS_API_KEY, ABACUS_API_BASE_URL, ABACUS_MODEL, SERPER_API_KEY
- [ ] Deploy успешен (статус live), страница логина отдаётся по HTTPS
- [ ] В базе применена схема (таблицы Prisma) и выполнен сид (admin@utc.local существует)
- [ ] `curl -I https://<service>.onrender.com` → HTTP 200/302
- [ ] Ни одно значение секрета не появилось в чате, в git, в .autopilot/ (только имена/заглушки)
