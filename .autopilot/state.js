window.STATE =
{
  "slug": "render-deploy",
  "dir": "2026-09-23-render-deploy--wip",
  "title": "Деплой УТК на Render.com",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-09-23-brief.md",
  "memoryFile": "AGENTS.md",
  "skillDir": "C:/Users/Latin/AppData/Local/hermes/skills/autopilot",
  "startedAt": "2026-09-23T22:03:00+03:00",
  "updatedAt": "2026-09-23T22:10:00+03:00",
  "finishedAt": null,
  "stages": [
    { "id": "preflight", "status": "done", "finishedAt": "2026-09-23T22:05:00+03:00" },
    { "id": "manifest",  "status": "done", "finishedAt": "2026-09-23T22:06:00+03:00" },
    { "id": "briefing",  "status": "done", "finishedAt": "2026-09-23T22:06:00+03:00", "note": "вопросов не потребовалось" },
    { "id": "spec",      "status": "done", "finishedAt": "2026-09-23T22:10:00+03:00" },
    { "id": "plan",      "status": "done", "startedAt": "2026-09-23T22:10:00+03:00", "finishedAt": "2026-09-23T22:12:00+03:00", "note": "2 таска, ярус T1" },
    { "id": "build",     "status": "active", "startedAt": "2026-09-23T22:12:00+03:00" },
    { "id": "review",    "status": "pending" },
    { "id": "final",     "status": "pending" }
  ],
  "requirements": {
    "total": 9, "done": 0, "inTicket": 9, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Подготовка Render-place (проверка доступности, API-ключ, аккаунт)",
      "requirements": ["R08i", "R09i"],
      "blockedBy": [],
      "wave": 1,
      "zone": ["вне репозитория: доступы и проверки"],
      "status": "in-progress",
      "startedAt": "2026-09-23T22:20:00+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "02",
      "title": "Деплой на Render.com и проверка по HTTPS",
      "requirements": ["R01", "R02", "R03", "R04", "R05", "R06", "R07"],
      "blockedBy": ["01"],
      "wave": 2,
      "zone": ["Render-панель + env + render.yaml"],
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
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
