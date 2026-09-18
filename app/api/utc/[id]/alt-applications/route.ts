import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAbacus, AbacusApiError } from '@/lib/abacus-client';
import { buildAltApplicationsPrompt } from '@/lib/alt-applications-prompt';
import { scoreVariants, rankAndFilter, type RawVariant } from '@/lib/alt-applications-filter';
import type { AltApplicationsNewFunction, AltApplicationsResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ParsedAltApplications {
  alternativeObjects: string[];
  newFunctions: AltApplicationsNewFunction[];
}

function tryParseAltApplicationsJson(raw: string): ParsedAltApplications | null {
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
    if (!Array.isArray(parsed?.alternativeObjects) || !Array.isArray(parsed?.newFunctions)) {
      return null;
    }
    const alternativeObjects: string[] = parsed.alternativeObjects
      .filter((v: any) => typeof v === 'string' && v.trim() !== '')
      .map((v: string) => v.trim());

    const newFunctions: AltApplicationsNewFunction[] = parsed.newFunctions
      .filter((f: any) => f && typeof f.function === 'string')
      .map((f: any) => ({
        function: String(f.function).trim(),
        objects: Array.isArray(f.objects)
          ? f.objects.filter((o: any) => typeof o === 'string' && o.trim() !== '').map((o: string) => o.trim())
          : [],
      }));

    return { alternativeObjects, newFunctions };
  } catch {
    return null;
  }
}

// POST /api/utc/[id]/alt-applications — поиск альтернативных областей применения (новых рынков)
// на основе уникальной технологической компетенции записи. Просмотр/аналитика — БД не изменяется.
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

    // Запись может быть любого узла иерархии УТК (PRODUCT/ELEMENT/PROCESS) — nodeType не фильтруем.
    const record = await prisma.uTCRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Запись УТК не найдена' }, { status: 404 });
    }

    // Шаг 1-2: сформировать точный промпт из ТЗ на основе данных записи и вызвать Abacus.ai.
    const prompt = buildAltApplicationsPrompt(record as any);

    let parsed: ParsedAltApplications;
    try {
      const rawAnswer = await callAbacus(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, maxTokens: 2500 }
      );
      const result = tryParseAltApplicationsJson(rawAnswer);
      if (!result) {
        return NextResponse.json(
          { error: 'AI вернул некорректный формат ответа. Попробуйте повторить поиск.' },
          { status: 502 }
        );
      }
      parsed = result;
    } catch (error) {
      if (error instanceof AbacusApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    // Шаг 5: собрать плоский список всех вариантов «морфологического ящика».
    // Согласно ТЗ (п. B): 5 альтернативных объектов (п.1) + по каждой из 5 новых функций (п.2) сама
    // функция-продукт как отдельный вариант + 3 её объекта (п.2.1) = 5 функций * 4 = 20.
    // Итого 5 + 20 = 25 вариантов (фактическое число зависит от того, сколько объектов реально вернул LLM
    // по каждой функции — ожидается 3, но не гарантировано; см. отчёт).
    const rawVariants: RawVariant[] = [
      ...parsed.alternativeObjects.map((description) => ({
        description,
        type: 'alternative_object' as const,
      })),
      ...parsed.newFunctions.flatMap((nf) => [
        // Сама новая придуманная функция/продукт (п.2) — отдельный вариант морфологического ящика.
        {
          description: `Новый продукт с функцией: ${nf.function}`,
          type: 'new_function_object' as const,
          parentFunction: nf.function,
        },
        // Плюс до 3 релевантных объектов приложения этой функции (п.2.1).
        ...nf.objects.map((obj) => ({
          description: `${nf.function} — ${obj}`,
          type: 'new_function_object' as const,
          parentFunction: nf.function,
        })),
      ]),
    ];

    // Шаг 6: оценка каждого варианта по 3 критериям через второй запрос к Abacus.ai.
    let allVariantsRanked: AltApplicationsResult['allVariantsRanked'] = [];
    try {
      const scores = await scoreVariants(rawVariants);
      allVariantsRanked = rankAndFilter(rawVariants, scores);
    } catch (error) {
      if (error instanceof AbacusApiError) {
        // Оценка не удалась, но исходные варианты уже получены — возвращаем их без ранжирования,
        // чтобы не терять результат первого (более дорогого) запроса.
        allVariantsRanked = rawVariants.map((v) => ({
          description: v.description,
          type: v.type,
          parentFunction: v.parentFunction,
          scores: { feasibility: 'medium', technicalFeasibility: 'medium', economicFeasibility: 'medium' },
          totalScore: 6,
          recommended: false,
        }));
      } else {
        throw error;
      }
    }

    const result: AltApplicationsResult = {
      alternativeObjects: parsed.alternativeObjects,
      newFunctions: parsed.newFunctions,
      allVariantsRanked,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ошибка поиска альтернативных областей применения:', error);
    return NextResponse.json(
      { error: 'Ошибка поиска альтернативных областей применения' },
      { status: 500 }
    );
  }
}
