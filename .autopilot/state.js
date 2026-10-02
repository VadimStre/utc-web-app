window.STATE =
{
  "slug": "utc-upgrade2",
  "dir": "2026-10-02-utc-upgrade2--wip",
  "title": "Доработка по TZ.docx: нумерация, примеры, дерево, экспорт HTML",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-10-02-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/Latin/AppData/Local/hermes/skills/autopilot",
  "startedAt": "2026-10-02T17:30:38+03:00",
  "updatedAt": "2026-10-02T17:45:00+03:00",
  "finishedAt": null,
  "stages": [
    { "id": "preflight", "status": "done", "finishedAt": "2026-10-02T17:30:38+03:00" },
    { "id": "manifest",  "status": "done", "finishedAt": "2026-10-02T17:32:00+03:00" },
    { "id": "briefing",  "status": "done", "finishedAt": "2026-10-02T17:33:00+03:00", "note": "5 вопросов (формат примеров, дерево, 2 экспорта)" },
    { "id": "spec",      "status": "done", "finishedAt": "2026-10-02T17:40:00+03:00", "note": "G2 пройден (ревьюер: 3 неполных → уточнены)" },
    { "id": "plan",      "status": "done", "finishedAt": "2026-10-02T17:45:00+03:00", "note": "3 таска, ярус T2" },
    { "id": "build",     "status": "active", "startedAt": "2026-10-02T17:45:00+03:00" },
    { "id": "review",    "status": "pending" },
    { "id": "final",     "status": "pending" }
  ],
  "requirements": {
    "total": 6, "done": 0, "inTicket": 6, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 0
  },
  "tickets": [
    { "id": "01", "title": "Нумерация поля 4 + примеры категорий (R01, R02, R03)", "requirements": ["R01", "R02", "R03"], "blockedBy": [], "wave": 1, "zone": ["lib/types.ts", "lib/wizard-prompts.ts", "components/help-guidance.tsx"], "status": "pending", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "02", "title": "Дерево: выразительные связи (R04)", "requirements": ["R04"], "blockedBy": [], "wave": 1, "zone": ["components/utc-tree.tsx"], "status": "pending", "retries": 0, "repairs": 0, "handoffs": 0 },
    { "id": "03", "title": "Экспорт в HTML: реестр и карточка (R05, R06)", "requirements": ["R05", "R06"], "blockedBy": ["01"], "wave": 2, "zone": ["lib/export-html.ts", "app/api/utc/export", "app/api/utc/[id]/export-html", "components/search-filters.tsx", "components/utc-view.tsx", "app/page.tsx"], "status": "pending", "retries": 0, "repairs": 0, "handoffs": 0 }
  ],
  "singlePass": null,
  "tests": null,
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": { "found": 7, "fixed": 4, "deferred": 3 },
  "concerns": [],
  "reviewers": { "manifestSpec": null, "craft": null },
  "blind": null
}
