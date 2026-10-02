import type { UTCRecord } from '@/lib/types';

/**
 * Общий рендер HTML-экспорта УТК (список и карточка).
 * Модуль владеет разметкой, стилями и экранированием; наружу выставляет
 * две функции — renderUtcHtmlList (реестр) и renderUtcHtmlRecord (карточка).
 * Оба документа самодостаточны: inline-CSS, без внешних ссылок/CDN,
 * открываются офлайн.
 */

/** Экранирование текста перед вставкой в HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Подпись поля записи (если есть в UTC_FIELD_LABELS) либо имя поля. */
function fieldLabel(field: keyof UTCRecord): string {
  const labels = {
    organization: 'Организация',
    keyProduct: 'Ключевой продукт',
    purpose: 'Назначение',
    categories: 'Категории',
    principle: 'Принцип действия',
    advantages: 'Преимущества',
    owner: 'Владелец',
    formulation: 'Формулировка УТК',
  } as const;
  return labels[field as keyof typeof labels] ?? String(field);
}

function formatDate(date?: Date | string | null): string {
  if (!date) return 'Не указано';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Не указано';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function layout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 24px;
    background: #f5f6f8;
    color: #1f2430;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    line-height: 1.5;
  }
  .container { max-width: 1100px; margin: 0 auto; }
  header.page-header { margin-bottom: 24px; }
  header.page-header h1 { margin: 0 0 4px; font-size: 26px; color: #171c26; }
  header.page-header p { margin: 0; color: #5b6472; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; background: #ffffff; }
  th, td { border: 1px solid #dde1e7; padding: 10px 12px; text-align: left; vertical-align: top; font-size: 13px; }
  thead th { background: #eef1f5; color: #333c4b; font-weight: 600; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .muted { color: #5b6472; }
  .records-count { margin: 0 0 12px; color: #5b6472; font-size: 14px; }
  ul.record-list { list-style: none; margin: 0; padding: 0; }
  li.record { background: #ffffff; border: 1px solid #dde1e7; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
  .record-head { display: flex; justify-content: space-between; gap: 12px; padding: 14px 20px; background: #eef1f5; border-bottom: 1px solid #dde1e7; flex-wrap: wrap; }
  .record-head h2 { margin: 0; font-size: 17px; color: #171c26; }
  .record-id { color: #5b6472; font-size: 13px; white-space: nowrap; }
  .record-body { padding: 16px 20px; }
  dl.record-fields { margin: 0; }
  dl.record-fields dt { margin: 12px 0 4px; font-weight: 600; font-size: 13px; color: #333c4b; }
  dl.record-fields dt:first-child { margin-top: 0; }
  dl.record-fields dd { margin: 0; font-size: 14px; white-space: pre-wrap; }
  dl.record-fields dd.empty { color: #8a919c; font-style: italic; }
  .meta-line { color: #5b6472; font-size: 13px; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #dde1e7; color: #8a919c; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  ${content}
</div>
</body>
</html>`;
}

/** Рендер реестра УТК в самодостаточный HTML-документ (таблица со всеми полями). */
export function renderUtcHtmlList(records: UTCRecord[]): string {
  const columns: { key: keyof UTCRecord; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'organization', label: 'Организация' },
    { key: 'keyProduct', label: 'Ключевой продукт' },
    { key: 'purpose', label: 'Назначение' },
    { key: 'categories', label: 'Категории' },
    { key: 'principle', label: 'Принцип действия' },
    { key: 'advantages', label: 'Преимущества' },
    { key: 'owner', label: 'Владелец' },
    { key: 'formulation', label: 'Формулировка УТК' },
    { key: 'createdAt', label: 'Дата создания' },
    { key: 'updatedAt', label: 'Дата обновления' },
  ];

  const thead = `<thead><tr>${columns
    .map((col) => `<th>${escapeHtml(col.label)}</th>`)
    .join('')}</tr></thead>`;

  const tbody = `<tbody>${records
    .map((record) => {
      const cells = columns
        .map((col) => {
          const value = record[col.key];
          const text =
            value === undefined || value === null || value === ''
              ? '—'
              : col.key === 'createdAt' || col.key === 'updatedAt'
                ? formatDate(value as Date | string)
                : String(value);
          return `<td>${escapeHtml(text)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('')}</tbody>`;

  const content = `
  <header class="page-header">
    <h1>Реестр УТК</h1>
    <p>Коммерциализация технологических компетенций — экспорт реестра</p>
  </header>
  <p class="records-count">Записей: ${records.length}</p>
  <table>${thead}${tbody}</table>`;

  return layout(content, 'Реестр УТК');
}

/** Рендер карточки УТК в самодостаточный HTML-документ (все поля записи, структурированно). */
export function renderUtcHtmlRecord(record: UTCRecord): string {
  const id = record.id ?? '—';

  const fields: { key: keyof UTCRecord; label: string }[] = [
    { key: 'organization', label: '1. Организация' },
    { key: 'keyProduct', label: '2. Ключевой продукт' },
    { key: 'purpose', label: '3. Назначение' },
    { key: 'categories', label: '4. Категории' },
    { key: 'principle', label: '5. Принцип действия' },
    { key: 'advantages', label: '6. Преимущества' },
    { key: 'owner', label: '7. Владелец' },
    { key: 'formulation', label: '8. Формулировка УТК' },
  ];

  const fieldBlocks = fields
    .map(({ key, label }) => {
      const value = record[key];
      const text =
        value === undefined || value === null || value === '' ? 'Не заполнено' : String(value);
      const cls = value === undefined || value === null || value === '' ? 'empty' : '';
      return `<dt>${escapeHtml(label)}</dt><dd class="${cls}">${escapeHtml(text)}</dd>`;
    })
    .join('');

  const content = `
  <header class="page-header">
    <h1>Карточка УТК</h1>
    <p>Коммерциализация технологических компетенций — запись #${escapeHtml(String(id))}</p>
  </header>
  <ul class="record-list">
    <li class="record">
      <div class="record-head">
        <h2>${escapeHtml(record.organization || 'Организация не указана')}</h2>
        <span class="record-id">ID: ${escapeHtml(String(id))}</span>
      </div>
      <div class="record-body">
        <dl class="record-fields">${fieldBlocks}</dl>
        <p class="meta-line">Дата создания: ${escapeHtml(formatDate(record.createdAt))} · Дата обновления: ${escapeHtml(formatDate(record.updatedAt))}</p>
      </div>
    </li>
  </ul>
  <footer>Сформировано системой «Коммерциализация технологических компетенций»</footer>`;

  return layout(content, `Карточка УТК #${id}`);
}
