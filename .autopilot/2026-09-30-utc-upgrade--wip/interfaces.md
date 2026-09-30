# interfaces.md — границы и швы проекта УТК (2026-09-30)

Читается каждым исполнителем до начала работы. Не изобретай заново то, что здесь есть.

## Границы, решённые в спецификации

- **Компоненты (client)**: `app/page.tsx` (главная), `components/utc-view.tsx` (карточка), `utc-table.tsx`, `utc-tree.tsx` (дерево), `utc-form.tsx` (форма), `utc-wizard.tsx` (AI-мастер), `competitor-search.tsx`, `alt-applications-search.tsx`, `search-filters.tsx`.
- **API (server)**: `app/api/utc` (CRUD), `app/api/utc/[id]/competitors` (+ `/apply`), `app/api/utc/[id]/alt-applications`, `app/api/utc/wizard/*`, `app/api/utc/tree`, `app/api/utc/export`, `app/api/admin/llm-settings`.
- **Типы/утилиты**: `lib/types.ts` (UTCRecord, UTC_FIELD_LABELS, WizardSession, AltApplicationVariant...), `lib/wizard-prompts.ts`, `lib/wizard-sessions.ts`, `lib/alt-applications-filter.ts`, `lib/alt-applications-prompt.ts`, `lib/serper-client.ts`, `lib/llm-client.ts`, `lib/db.ts` (Prisma), `lib/auth.ts`.

## Общие правила проекта

- Стек: Next.js 14 (App Router), TypeScript, Prisma+PostgreSQL, shadcn/ui, Tailwind.
- Запуск: `npm run dev` (http://localhost:3000); сборка: `npm run build`; тесты: `npm test` (если есть).
- **Запрещено трогать**: `prisma/schema.prisma` без явного требования (миграции — отдельно); `lib/auth.ts`, `lib/db.ts`, `.env*`; секреты не логировать и не коммитить.
- **Если не хватает зависимости — не добавляй сам, верни `BLOCKED` с названием** (кроме добавления в `package.json` для `.docx` — это согласовано).
- Сессии AI-мастера — in-memory (`lib/wizard-sessions.ts`), не переживают перезапуск.

## Из таска 01 — тексты
- `app/page.tsx`: h1 = «Коммерциализация технологических компетенций» (по центру), CardDescription = «Найдите нужные записи УТК».
- `app/layout.tsx`: metadata.title = «Коммерциализация технологических компетенций».
- `lib/types.ts`: `UTC_FIELD_LABELS.categories` = «Назовите более общую группу Объектов, к которой применима Функция Продукта (более широкое понятие, ближайшее надмножество, обобщающая категория)».
- `lib/wizard-prompts.ts`: systemPrompt пункт 4 и `questions.categories` обновлены аналогично.

## Из таска 02 — кнопка «назад» в AI-мастере
- Новый API `POST /api/utc/wizard/back` (тело: `{ wizardSessionId }`) → откат currentStep на 1, удаление последней пары (user+assistant), возврат `{ question, step, totalSteps }` (`question` — последнее assistant-сообщение после отката, `FIRST_QUESTION` если их нет; `step` — 1-based) + `{ expired: true }` при 404/410.
- `lib/wizard-sessions.ts`: новая функция `goBack(id): WizardSession | undefined` — currentStep−1 (не ниже 0), удаление последних 2 сообщений.
- Клиент `utc-wizard.tsx`: кнопка «Назад» (ArrowLeft, неактивна на шаге 1/isSending/isGoingBack), восстановление предыдущего вопроса и ответа (history ответов в state, `answersHistory`).

## Из таска 03 — скачивание .docx
- Новая API `GET/POST /api/utc/[id]/alt-applications/export` → генерирует `.docx` (библиотека `docx`), заголовок: «8. Формулировка УТК» + разделы «Новые области для той же Функции», «Новые типы Продуктов», «Сводный рейтинг всех вариантов».
- Клиент `alt-applications-search.tsx`: кнопка «Скачать» (иконка Download) → скачивание blob.
- `docx` добавить в dependencies (согласовано).

## Из таска 04 — подсветка в дереве
- `components/utc-tree.tsx`: заголовок узла (keyProduct) выделить цветом/фоном (рекурсивно, все уровни).

## Из таска 05 — форматирование «6. Преимущества»
- `utc-view.tsx` и `utc-form.tsx`: рендер значения advantages с маркированным списком (строки `-` → `<li>`), переносы сохраняются.
- `apply/route.ts`: блок в advantages формировать с переносами и маркерами `-`.

## Из таска 06 — ссылки на источники
- «Конкуренты»: sourceUrl уже есть (проверить, что показывается).
- «Альт. применения»: расширить `AltApplicationVariant` полем `sources?: { title: string; url: string }[]`; в route после первой генерации — Serper-поиск по рекомендованным вариантам, прикрепить ссылки (не ломать основной ответ, лимит ~5, таймаут).
- Клиент: под вариантом — ссылки «Источник» (ExternalLink, target=_blank).

## Из таска 07 — декомпозиция в промпте
- `lib/alt-applications-prompt.ts`: добавить шаг 0: «Сначала из текста выдели главную ФУНКЦИЮ и ОБЪЕКТ приложения, затем генерируй альтернативы» (до пунктов 1–2.2). Схему JSON не ломать.

## Из таска 08 — админ: пользователи
- Новая API `GET /api/admin/users` (ADMIN): `prisma.user.findMany({ include: { records: { select: { id, formulation, keyProduct, createdAt } } } })`.
- Вкладка «Пользователи и УТК» в `app/admin/settings/page.tsx` (Tabs), таблица пользователей.
- Компонент таблицы пользователей в `components/`.

## Из таска 09 — доступ к поиску только авторам
- `utc-view.tsx`: оба блока (конкуренты + альт. применения) только при `record.canEdit`.
- API `alt-applications` и `competitors` (POST): проверка `isAdmin || record.ownerId === session.user.id`, иначе 403. Системные записи (ownerId=null) — только админ.
