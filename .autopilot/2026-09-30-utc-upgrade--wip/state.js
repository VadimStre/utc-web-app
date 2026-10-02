window.STATE =
{
  "slug": "utc-upgrade",
  "dir": "2026-09-30-utc-upgrade--wip",
  "title": "Доработка УТК: интерфейс, AI-логика, админка",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-09-30-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/Latin/AppData/Local/hermes/skills/autopilot",
  "startedAt": "2026-09-30T12:23:04+03:00",
  "updatedAt": "2026-09-30T12:40:00+03:00",
  "finishedAt": null,
  "stages": [
    { "id": "preflight", "status": "done", "finishedAt": "2026-09-30T12:24:00+03:00" },
    { "id": "manifest",  "status": "done", "finishedAt": "2026-09-30T12:26:00+03:00" },
    { "id": "briefing",  "status": "done", "finishedAt": "2026-09-30T12:32:00+03:00", "note": "3 вопроса (R03, R06, R11)" },
    { "id": "spec",      "status": "done", "finishedAt": "2026-09-30T12:36:00+03:00" },
    { "id": "plan",      "status": "done", "startedAt": "2026-09-30T12:36:00+03:00", "finishedAt": "2026-09-30T12:40:00+03:00", "note": "9 тасков, ярус T2" },
    { "id": "build",     "status": "active", "startedAt": "2026-09-30T12:40:00+03:00" },
    { "id": "review",    "status": "pending" },
    { "id": "final",     "status": "pending" }
  ],
  "requirements": {
    "total": 12, "done": 0, "inTicket": 12, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 0
  },
  "tickets": [
    { "id": "01", "title": "Заголовки и тексты (R01, R07, R08, R09)", "requirements": ["R01", "R07", "R08", "R09"], "blockedBy": [], "wave": 1, "zone": ["app/page.tsx", "app/layout.tsx", "lib/types.ts", "lib/wizard-prompts.ts", "components/alt-applications-search.tsx"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "02", "title": "Кнопка «назад» в AI-мастере (R02)", "requirements": ["R02"], "blockedBy": [], "wave": 1, "zone": ["components/utc-wizard.tsx", "app/api/utc/wizard/*", "lib/wizard-sessions.ts"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "03", "title": "Скачать .docx результатов альт. применений (R03)", "requirements": ["R03"], "blockedBy": [], "wave": 1, "zone": ["components/alt-applications-search.tsx", "app/api/utc/[id]/alt-applications/export", "lib/", "package.json"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "04", "title": "Подсветка «Ключевой продукт» в дереве (R04)", "requirements": ["R04"], "blockedBy": [], "wave": 1, "zone": ["components/utc-tree.tsx"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "05", "title": "Форматирование «6. Преимущества» (R05)", "requirements": ["R05"], "blockedBy": [], "wave": 1, "zone": ["components/utc-view.tsx", "components/utc-form.tsx", "app/api/utc/[id]/competitors/apply"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "06", "title": "Ссылки на источники в выдаче (R06)", "requirements": ["R06"], "blockedBy": [], "wave": 1, "zone": ["components/alt-applications-search.tsx", "lib/alt-applications-filter.ts", "lib/types.ts", "app/api/utc/[id]/alt-applications", "lib/serper-client.ts"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "07", "title": "Декомпозиция ФУНКЦИЯ/ОБЪЕКТ в промпте (R10)", "requirements": ["R10"], "blockedBy": [], "wave": 1, "zone": ["lib/alt-applications-prompt.ts"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "08", "title": "Админ: просмотр пользователей и их УТК (R11)", "requirements": ["R11"], "blockedBy": [], "wave": 1, "zone": ["app/admin/settings/page.tsx", "app/api/admin/users", "components/"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "09", "title": "Доступ к поиску только авторам (R12)", "requirements": ["R12"], "blockedBy": [], "wave": 1, "zone": ["components/utc-view.tsx", "app/api/utc/[id]/alt-applications", "app/api/utc/[id]/competitors"], "status": "done", "finishedAt": "2026-09-30T13:26:00+03:00", "retries": 0, "repairs": 0, "handoffs": 0 }
  ],
  "singlePass": null,
  "tests": null,
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": null,
  "concerns": [],
  "reviewers": { "manifestSpec": null, "craft": null },
  "blind": null
}
