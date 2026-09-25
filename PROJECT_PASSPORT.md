# ПАСПОРТ ПРОЕКТА «База данных УТК»

> Для нового сеанса / нового разработчика. Содержит всё необходимое, чтобы продолжить работу без потери контекста.
> Актуально на: 2026-09-24 (коммит `89e5f0c`)

---

## 1. СУТЬ ПРОЕКТА

Веб-система для учёта **уникальных технологических компетенций (УТК)** — аналог «базы данных прорывных технологий» с AI-инструментами.

**Стек:** Next.js 14 (App Router, TypeScript) + Prisma 6.7 + PostgreSQL + NextAuth (email+пароль) + shadcn/ui + Tailwind.
**AI:** Abacus.ai RouteLLM (OpenAI-совместимый) + Serper.dev (веб-поиск конкурентов).
**Роли:** ADMIN (все права) / USER (свои записи: редактирование; чужие: только просмотр).

**Реализованные этапы ТЗ (все 6):**
1. Auth + роли (NextAuth)
2. Иерархия УТК + дерево (PRODUCT/ELEMENT/PROCESS, parentId)
3. AI-мастер ввода (`/wizard`)
4. Поиск конкурентов с фактчеком (Serper + Abacus, sourceUrl + confidence)
5. Альтернативные применения («морфологический ящик», 5+5×4 вариантов, оценки)
6. Переключатель облачная/локальная LLM (`/admin/settings`, для ADMIN)

---

## 2. РЕПОЗИТОРИЙ

- **GitHub:** `https://github.com/VadimStre/utc-web-app` (публичный)
- **Ветка:** `main`
- **Локальная копия:** `C:\Users\Latin\work\utc_web_app_local`
- **Актуальный коммит:** `89e5f0c` («compose.prod: команда build && start»)

**Git-аккаунты (ВАЖНО, частая путаница):**
- GitHub-аккаунт: **VadimStre** (это правильный, основной)
- Не путать с `VadimStren` (другой, случайный аккаунт — там был создан пустой репозиторий)
- Коммиты от имени: `git -c user.email=agent@utc.local -c user.name="Hermes Agent" commit ...`

---

## 3. ПРОДАКШЕН (деплой) — Timeweb Cloud VPS

**Рабочий сайт:** `http://104.171.129.12` (НОВЫЙ IP, работает; старый 5.42.106.111 — отвязан/не работает из-за магистральной фильтрации Timeweb)

**Сервер (VPS):**
- IP: `104.171.129.12` (публичный; добавлен с DDoS-защитой)
- Хостнейм: `msk-1-vm-11xr`, нода `kvmnvm-801`, Ubuntu 26.04
- Доступ: **только через веб-консоль Timeweb** (SSH снаружи не работает — Timeweb режет баннер; для администрирования используем веб-консоль в панели: Серверы → Daring Vulpecula → Консоль)
- root-пароль: хранится у пользователя (в [REDACTED] переписке), в чат не выводить
- ВАЖНО: имя контейнера `utc_app` (с подчёркиванием!) — при копировании из чата подчёркивания теряются → набирать вручную

**Код на сервере:** `/opt/utc` (git-копия; синхронизируется `git pull origin main`)

**.env.prod на сервере** (секреты, НЕ в git): `/opt/utc/.env.prod`
- `DB_PASSWORD=...`, `NEXTAUTH_SECRET=...`, `NEXTAUTH_URL=http://104.171.129.12` (важно: без :3000!)
- `ABACUS_API_KEY=...`, `ABACUS_API_BASE_URL=https://routellm.abacus.ai/v1`, `ABACUS_MODEL=route-llm`
- `SERPER_API_KEY=...`
- Длины ключей (проверять при проблемах): SERPER=40, ABACUS=35 (усечённые ключи давали «неверный ключ»)

---

## 4. ПРОЦЕСС ДЕПЛОЯ (ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ КОДА)

**1. Локально:** `git add -A && git commit -m "..." && git push origin main`

**2. На сервере (веб-консоль, по очереди):**
```
cd /opt/utc && git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate
```
(сборка ~15–20 мин; НЕ прерывать; при ошибке смотреть последние строки)

**3. Проверка после деплоя:**
```
docker exec utc_app sh -c "node -e \"fetch('http://localhost:3000').then(r=>console.log('HTTP',r.status)).catch(e=>console.log('ERR',e.message))\""
```
(ждём `HTTP 200`) + с локальной машины: `curl.exe -I http://104.171.129.12/`

**4. Смена IP** (если нужно): панель Timeweb → Серверы → вкладка «Сеть» → Добавить IP → привязать → отвязать старый; после смены: `sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://<новый-IP>|' /opt/utc/.env.prod` + пересоздать контейнеры.

---

## 5. docker-compose.prod.yml (актуальная структура)

- `db` (postgres:16, контейнер `utc_postgres`, том `utc_pgdata`, healthcheck) — порт НЕ пробрасывается наружу
- `app`:
  - `build: {context: ., dockerfile: Dockerfile.prod}` + `image: utc-app:latest`
  - `container_name: utc_app`, `restart: unless-stopped`
  - **`command: ["sh", "-c", "cd /app && npm run build && npm run start"]`** (КРИТИЧНО: .next не собирается в образе, поэтому build при старте)
  - `ports: ["80:3000"]` (наружу 80 → внутри 3000)
  - env: DATABASE_URL (из DB_PASSWORD), NEXTAUTH_SECRET/URL, ABACUS_*, SERPER_API_KEY, NODE_ENV

**Dockerfile.prod (node:20-bookworm-slim):**
- npm регистри npmjs + retries; PRISMA_ENGINES_MIRROR (npmmirror) — движки prisma (binaries.prisma.sh заблокирован в РФ)
- apt install openssl/ca-certificates (с retry)
- `npm install --legacy-peer-deps` (prisma/tsx в dependencies)
- `test -x node_modules/.bin/prisma` (гарантия)
- `prisma generate --no-hints` ПОСЛЕ `COPY . .` (схема на месте)
- **postinstall в package.json УДАЛЁН** (падал: на этапе npm install схемы ещё нет)

---

## 6. БАЗА ДАННЫХ (PostgreSQL в Docker)

- URL: `postgresql://utc_user:<DB_PASSWORD>@db:5432/utc_db` (внутри docker-сети; снаружи закрыт)
- **Схема:** `prisma db push` применяется при старте контейнера (в entrypoint/команде) — БД «уже в синхроне»
- **Сид:** `npx tsx scripts/seed-if-empty.ts` (заполняет, только если БД пуста): админ + 7 демо-записей
- **Вход админа:** `admin@utc.local` / `Admin12345!` (сменить после первого входа!)
- Модель: UTCRecord (organization, keyProduct, purpose, categories, principle, advantages, owner, formulation, ownerId, nodeType: PRODUCT/ELEMENT/PROCESS, parentId)

---

## 7. ОТЛАДКА/ДИАГНОСТИКА (если что-то не работает)

| Симптом | Причина | Решение |
|---|---|---|
| Сайт не открывается снаружи, внутри 200 | Магистральная фильтрация IP Timeweb | Сменить IP (п.4) / ждать решения Timeweb |
| «Неверный ключ Serper/Abacus» | Ключ усечён в .env.prod | Проверить длины (SERPER=40, ABACUS=35), переписать |
| Контейнер restarting, «production build» | .next не собран | Команда в compose должна быть `build && start` |
| Сборка падает на postinstall prisma | postinstall в package/lock | Удалён; если вернётся — убрать + `hasInstallScript` из lock |
| «Корневая запись должна быть PRODUCT» | Форма шлёт ELEMENT для корневой | В utc-form.tsx дефолт nodeType: PRODUCT |
| AI-оценки «Средняя/6» | maxTokens мал (ответ обрезался) | maxTokens 8000 + timeoutMs 120000 |

---

## 8. ИЗВЕСТНЫЕ ОСОБЕННОСТИ / ГРАБЛИ

1. **Подчёркивания теряются при копировании в веб-консоль** (`utc_app` → `utc app`) — команды набирать вручную или перепроверять.
2. **SSH снаружи не работает** (Timeweb режет баннер) — только веб-консоль (VNC).
3. **Порт 3000 снаружи Timeweb тоже резал** — используется 80 (стандартный).
4. Раньше был выбран Neon/Supabase — **отказались** (обрывы соединений), используется локальный Postgres в Docker.
5. **Образ `utc-app:fixed`** (ручной commit) — НЕ использовать для деплоя, только `utc-app:latest` из build.
6. В репозитории есть `.autopilot/` (незакрытая задача render-deploy) — можно игнорировать/удалить.
7. GitHub-аккаунт: **VadimStre** — основной; `VadimStren` — не использовать.

---

## 9. ПЛАНЫ / ОТКРЫТЫЕ ВОПРОСЫ

- [ ] **Домен + HTTPS** (убрать «Не защищено»; Timeweb умеет бесплатные SSL) — рекомендация
- [ ] **Бэкапы БД** (ежедневный `pg_dump` или бэкапы Timeweb)
- [ ] **Проверить AI-функции после фикса ключей** (конкуренты, альтернативные применения, мастер)
- [ ] (Опционально) вернуться на РФ-домен после стабилизации
- [ ] Вычистить `.autopilot/` (незакрытая задача render-deploy)

---

## 10. КЛЮЧЕВЫЕ ФАЙЛЫ

- `app/api/utc/route.ts` — CRUD + валидация nodeType
- `app/api/utc/[id]/alt-applications/route.ts` — альтернативные применения (морфологический ящик)
- `app/api/utc/[id]/competitors/route.ts` — поиск конкурентов (Serper+Abacus)
- `components/utc-form.tsx` — форма создания/редактирования (nodeType!)
- `components/utc-table.tsx` — таблица (колонка Действия после ID)
- `components/utc-view.tsx` — просмотр записи (что видно кому: конкуренты — только автор/админ, альтернативы — все)
- `lib/alt-applications-filter.ts` — оценка вариантов (maxTokens 8000)
- `lib/abacus-client.ts`, `lib/llm-client.ts` — AI-клиенты
- `scripts/docker-entrypoint.prod.sh` — entrypoint (db push → seed → build → start)
- `docker-compose.prod.yml`, `Dockerfile.prod` — деплой
