# interfaces.md — границы и швы проекта УТК (2026-10-02, utc-upgrade2)

Читается каждым исполнителем до начала работы. Не изобретай заново то, что здесь есть.

## Границы, решённые в спецификации (TZ.docx)

### Стек и правила проекта (общие)

- **Стек:** Next.js 14 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth, shadcn/ui, Tailwind.
- **Запуск:** `npm run dev` (http://localhost:3000); **сборка:** `npm run build` (должна быть зелёной); тесты: `npm test` (если есть).
- **Запрещено трогать:** `prisma/schema.prisma`, `lib/auth.ts`, `lib/db.ts`, `.env*`; секреты не логировать и не коммитить (ключи — только в `.env*`).
- **Если не хватает зависимости — не добавляй сам**, верни `BLOCKED` с названием (никаких новых npm-пакетов в этих тасках).
- Сессии AI-мастера — in-memory (`lib/wizard-sessions.ts`), не переживают перезапуск.

### Модули и их границы (из спецификации §Границы и швы)

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| `lib/export-html.ts` (новый) | генерация HTML-документов (список и карточка), стили | `renderUtcHtmlList(records: UTCRecord[]): string`, `renderUtcHtmlRecord(record: UTCRecord): string` | разметку/стили, экранирование HTML |
| `app/api/utc/export` | экспорт реестра по фильтрам | `GET ?format=html|json` → файл | выборку, формат |
| `app/api/utc/[id]/export-html` (новый) | экспорт одной карточки | `GET` → .html (auth) | права, выборку записи |
| `components/utc-tree.tsx` | отрисовка дерева | `UTCTree({ nodes, onView, onEdit, onAddChild })` | линии-ветви, отступы |
| `components/help-guidance.tsx` | справка, примеры | `HelpGuidance()` | тексты примеров |
| `lib/types.ts` | константы надписей/примеров | `UTC_FIELD_LABELS`, `UTC_EXAMPLES` | — |

### Решения по таскам

#### Таск 01 — нумерация поля 4 + примеры
- `lib/types.ts`: `UTC_FIELD_LABELS.categories` = «4. Назовите более общую группу Объектов, к которой применима Функция Продукта (более широкое понятие, ближайшее надмножество, обобщающая категория)» (префикс «4. » + старый текст).
- `UTC_EXAMPLES.categories` = «Исследуемые микроматериалы» (одно значение, равно примеру 1 справки).
- `lib/wizard-prompts.ts`: пункт 4 системного промпта и `questions.categories` — тот же префикс «4. ».
- `components/help-guidance.tsx`: массив `examples[]` — только поля `categories`: пример 1 «Исследуемые микроматериалы», пример 2 «Оптические измерительные системы», пример 3 «Мехатронные позиционные платформы». Остальное не трогать.

#### Таск 02 — дерево
- Только `components/utc-tree.tsx`: линии-ветви слева (CSS `border-l` + псевдоэлементы `/absolute`), у последнего ребёнка — излом, у узла без детей — нет ветки. Отступ = level * 24px + линия. Состав узла (бейджи, ID) не менять.

## Из таска 03 — экспорт HTML
- **Новый** `lib/export-html.ts`: `renderUtcHtmlList(records: UTCRecord[]): string` (реестр), `renderUtcHtmlRecord(record: UTCRecord): string` (карточка); самодостаточные документы (inline-CSS, без внешних ссылок), экранирование полей.
- `app/api/utc/export/route.ts`: CSV удалён; `format === 'html'` → `utc_records.html`; JSON не тронут.
- **Новый** `app/api/utc/[id]/export-html/route.ts`: GET; auth (401) → 404 (нет записи) → 403 (не автор/не админ); `utc-<id>.html`.
- `components/search-filters.tsx`: кнопка «HTML» (FileCode) вместо «CSV», `onExport('html')`.
- `app/page.tsx`: `handleExport(format: 'json' | 'html')`, имя `utc_records.<format>`.
- `components/utc-view.tsx`: кнопка «Скачать» (Download) в шапке карточки, видна при `record.canEdit`; GET export-html → blob → download.

## Швы для тестов
- Сборка `npm run build` (typecheck по всем файлам) — главный шов.
- Ручная проверка: открыть сгенерированные .html; визуально проверить дерево.
