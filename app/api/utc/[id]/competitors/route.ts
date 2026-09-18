import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { searchCompetitors, SerperApiError } from '@/lib/serper-client';
import { callAbacus, AbacusApiError } from '@/lib/abacus-client';
import type { CompetitorInfo, CompetitorSearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

function tryParseCompetitorsJson(raw: string): { competitors: CompetitorInfo[]; note?: string } | null {
  let text = raw.trim();
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    text = fencedMatch[1].trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.competitors)) {
      return null;
    }
    const competitors: CompetitorInfo[] = parsed.competitors
      .filter((item: any) => item && typeof item.companyName === 'string')
      .map((item: any) => ({
        companyName: String(item.companyName || '').trim(),
        product: typeof item.product === 'string' ? item.product.trim() : '',
        characteristics: Array.isArray(item.characteristics)
          ? item.characteristics
              .filter((c: any) => c && typeof c.name === 'string')
              .map((c: any) => ({
                name: String(c.name || '').trim(),
                value: typeof c.value === 'string' ? c.value.trim() : String(c.value ?? ''),
              }))
          : [],
        sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl.trim() : '',
        confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low',
      }));
    return { competitors, note: typeof parsed.note === 'string' ? parsed.note : undefined };
  } catch {
    return null;
  }
}

// POST /api/utc/[id]/competitors — поиск конкурентов-аналогов через Serper.dev + фактчек через Abacus.ai
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Неверный ID записи' }, { status: 400 });
    }

    const record = await prisma.uTCRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Запись УТК не найдена' }, { status: 404 });
    }

    let additionalContext = '';
    try {
      const body = await request.json();
      if (body && typeof body.additionalContext === 'string') {
        additionalContext = body.additionalContext.trim();
      }
    } catch {
      // Тело запроса необязательно — игнорируем ошибку парсинга пустого body.
    }

    // Шаг 1: сформировать поисковый запрос через LLM на основе ключевого продукта и принципа действия.
    let searchQuery: string;
    try {
      const queryPrompt = [
        {
          role: 'user' as const,
          content:
            `Сформулируй ОДИН короткий и эффективный поисковый запрос (на английском языке, ` +
            `так как это даёт больше релевантных результатов о мировых производителях) для поиска ` +
            `в интернете компаний-мировых лидеров и продуктов-аналогов (конкурентов) для следующего продукта:\n\n` +
            `Ключевой продукт: ${record.keyProduct}\n` +
            `Принцип действия: ${record.principle}\n` +
            (additionalContext ? `Дополнительный контекст от пользователя: ${additionalContext}\n` : '') +
            `\nПример формата ответа: "world leading manufacturer <продукт> <ключевая характеристика>".\n` +
            `Ответь ТОЛЬКО текстом поискового запроса, без кавычек, без пояснений, одной строкой.`,
        },
      ];
      const rawQuery = await callAbacus(queryPrompt, { temperature: 0.3, maxTokens: 100 });
      searchQuery = rawQuery.replace(/^["'«]+|["'»]+$/g, '').split('\n')[0].trim();
      if (!searchQuery) {
        throw new Error('empty');
      }
    } catch {
      // Фолбэк: если LLM недоступен для генерации запроса — собираем запрос эвристически.
      searchQuery = `world leading manufacturer ${record.keyProduct} ${additionalContext}`.trim();
    }

    // Шаг 2: веб-поиск через Serper.dev
    let rawResults;
    try {
      rawResults = await searchCompetitors(searchQuery);
    } catch (error) {
      if (error instanceof SerperApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    if (rawResults.length === 0) {
      const emptyResult: CompetitorSearchResult = {
        searchQuery,
        rawResults: [],
        competitors: [],
        note: 'Поиск не вернул результатов. Попробуйте уточнить запрос через дополнительный контекст.',
      };
      return NextResponse.json(emptyResult);
    }

    // Шаг 3: извлечение конкурентов + фактчек через Abacus.ai. Промпт явно запрещает выдумывать факты
    // и требует указания источника (URL) для каждого утверждения — защита от галлюцинаций.
    const searchResultsText = rawResults
      .map(
        (r, i) =>
          `[${i + 1}] Заголовок: ${r.title}\nURL: ${r.link}\nСниппет: ${r.snippet}`
      )
      .join('\n\n');

    const factCheckPrompt = [
      {
        role: 'user' as const,
        content:
          `Ты — эксперт по анализу рынка и конкурентной разведке. Ниже приведены результаты веб-поиска ` +
          `по запросу "${searchQuery}" для продукта "${record.keyProduct}" (принцип действия: ${record.principle}).\n\n` +
          `РЕЗУЛЬТАТЫ ПОИСКА:\n${searchResultsText}\n\n` +
          `ЗАДАЧА: Извлеки из ЭТИХ результатов поиска до 3-5 конкретных компаний-конкурентов ` +
          `(мировых лидеров) с их продуктами-аналогами и доступными техническими характеристиками.\n\n` +
          `КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА (проверка на галлюцинации):\n` +
          `1. НЕ ВЫДУМЫВАЙ факты, компании, продукты или характеристики, которых нет в предоставленных результатах поиска.\n` +
          `2. Каждое утверждение (компания, продукт, характеристика) ДОЛЖНО быть обосновано конкретным URL ` +
          `из результатов поиска выше (поле sourceUrl должно совпадать с одним из URL из списка результатов).\n` +
          `3. Если в предоставленных результатах поиска НЕТ ДОСТАТОЧНО ДАННЫХ для уверенного вывода — ` +
          `явно укажи это в поле "note" вместо того, чтобы придумывать данные. В этом случае верни ` +
          `частичный список компаний (только те, для которых есть реальные основания) или пустой массив.\n` +
          `4. Используй поле "confidence": "high" — если характеристики явно указаны в сниппете; ` +
          `"medium" — если данные косвенные или неполные; "low" — если информация о компании упомянута, ` +
          `но конкретных характеристик почти нет.\n` +
          `5. Не приписывай компании характеристики другой компании.\n\n` +
          `Ответь СТРОГО в формате валидного JSON (без markdown-разметки, без пояснений до/после), по схеме:\n` +
          `{\n` +
          `  "competitors": [\n` +
          `    {\n` +
          `      "companyName": "string",\n` +
          `      "product": "string",\n` +
          `      "characteristics": [{ "name": "string", "value": "string" }],\n` +
          `      "sourceUrl": "string (URL из результатов поиска)",\n` +
          `      "confidence": "high" | "medium" | "low"\n` +
          `    }\n` +
          `  ],\n` +
          `  "note": "string (опционально — пояснение о недостатке данных, если применимо)"\n` +
          `}`,
      },
    ];

    let extracted: { competitors: CompetitorInfo[]; note?: string };
    try {
      const rawAnswer = await callAbacus(factCheckPrompt, { temperature: 0.2, maxTokens: 1500 });
      const parsed = tryParseCompetitorsJson(rawAnswer);
      if (!parsed) {
        return NextResponse.json(
          { error: 'AI-фактчекер вернул некорректный формат ответа. Попробуйте повторить поиск.' },
          { status: 502 }
        );
      }
      extracted = parsed;
    } catch (error) {
      if (error instanceof AbacusApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    const result: CompetitorSearchResult = {
      searchQuery,
      rawResults,
      competitors: extracted.competitors,
      note: extracted.note,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ошибка поиска конкурентов:', error);
    return NextResponse.json({ error: 'Ошибка поиска конкурентов-аналогов' }, { status: 500 });
  }
}
