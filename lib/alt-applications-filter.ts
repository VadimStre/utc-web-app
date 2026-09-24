// Алгоритм отбора («морфологический ящик») для режима поиска альтернативных областей
// применения (Этап 5). После генерации сырого списка вариантов (25 шт.) LLM оценивает
// каждый вариант по 3 критериям (low/medium/high), затем rankAndFilter считает
// итоговый балл, сортирует и отмечает рекомендованные (топ-треть, но не более 10).

import { callLLM, LlmApiError } from '@/lib/llm-client';
import type { AltApplicationVariant, FeasibilityLevel } from '@/lib/types';

export { LlmApiError };

const SCORE_MAP: Record<FeasibilityLevel, number> = { low: 1, medium: 2, high: 3 };

export interface RawVariant {
  description: string;
  type: AltApplicationVariant['type'];
  parentFunction?: string;
}

interface VariantScoreResponse {
  index: number;
  feasibility: FeasibilityLevel;
  feasibilityReason?: string;
  technicalFeasibility: FeasibilityLevel;
  technicalFeasibilityReason?: string;
  economicFeasibility: FeasibilityLevel;
  economicFeasibilityReason?: string;
}

function normalizeLevel(value: any): FeasibilityLevel {
  return ['low', 'medium', 'high'].includes(value) ? value : 'medium';
}

function tryParseScoresJson(raw: string): VariantScoreResponse[] | null {
  let text = raw.trim();
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    text = fencedMatch[1].trim();
  }
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    text = text.slice(firstBracket, lastBracket + 1);
  } else {
    // Иногда модель может обернуть массив в объект { "scores": [...] }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsedObj = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        if (Array.isArray(parsedObj?.scores)) {
          text = JSON.stringify(parsedObj.scores);
        }
      } catch {
        // ignore, fall through to direct array parse attempt below
      }
    }
  }

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item: any, i: number) => ({
      index: typeof item.index === 'number' ? item.index : i,
      feasibility: normalizeLevel(item.feasibility),
      feasibilityReason: typeof item.feasibilityReason === 'string' ? item.feasibilityReason : undefined,
      technicalFeasibility: normalizeLevel(item.technicalFeasibility),
      technicalFeasibilityReason:
        typeof item.technicalFeasibilityReason === 'string' ? item.technicalFeasibilityReason : undefined,
      economicFeasibility: normalizeLevel(item.economicFeasibility),
      economicFeasibilityReason:
        typeof item.economicFeasibilityReason === 'string' ? item.economicFeasibilityReason : undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Вызывает Abacus.ai для оценки каждого варианта из «морфологического ящика» по трём критериям:
 * физическая реализуемость, технико-технологическая целесообразность, экономическая целесообразность.
 */
export async function scoreVariants(variants: RawVariant[]): Promise<VariantScoreResponse[]> {
  const listText = variants
    .map((v, i) => `${i}. [${v.type === 'alternative_object' ? 'альтернативный объект' : 'новая функция/объект'}]${v.parentFunction ? ` (функция: ${v.parentFunction})` : ''} ${v.description}`)
    .join('\n');

  const prompt = [
    {
      role: 'user' as const,
      content:
        `Ты — эксперт по технико-экономической оценке новых продуктовых идей (метод морфологического ящика). ` +
        `Ниже приведён список из ${variants.length} вариантов альтернативных областей применения одной и той же ` +
        `уникальной технологической компетенции.\n\n` +
        `СПИСОК ВАРИАНТОВ (индексация с 0):\n${listText}\n\n` +
        `ЗАДАЧА: Оцени КАЖДЫЙ вариант по трём критериям, каждый со значением "low", "medium" или "high":\n` +
        `1. feasibility — физическая реализуемость (насколько физически возможно применить принцип действия к этому объекту/функции),\n` +
        `2. technicalFeasibility — технико-технологическая целесообразность (насколько разумно и оправдано с инженерной точки зрения),\n` +
        `3. economicFeasibility — экономическая целесообразность (есть ли рыночный спрос, окупаемость).\n` +
        `Для каждого критерия дай краткое обоснование (1 предложение) в соответствующем поле *Reason.\n\n` +
        `Ответь верни СТРОГО в формате JSON без markdown-обёртки — массив из ровно ${variants.length} объектов, по схеме:\n` +
        `[\n` +
        `  {\n` +
        `    "index": number,\n` +
        `    "feasibility": "low"|"medium"|"high",\n` +
        `    "feasibilityReason": "string",\n` +
        `    "technicalFeasibility": "low"|"medium"|"high",\n` +
        `    "technicalFeasibilityReason": "string",\n` +
        `    "economicFeasibility": "low"|"medium"|"high",\n` +
        `    "economicFeasibilityReason": "string"\n` +
        `  }\n` +
        `]` ,
    },
  ];

  const rawAnswer = await callLLM(prompt, { temperature: 0.3, maxTokens: 8000, timeoutMs: 120000 });
  const parsed = tryParseScoresJson(rawAnswer);
  if (!parsed) {
    throw new LlmApiError('AI-оценщик вернул некорректный формат ответа при отборе вариантов.', 502);
  }
  return parsed;
}

/**
 * Считает итоговый балл каждого варианта (сумма 3 критериев, low=1/medium=2/high=3, диапазон 3..9),
 * сортирует по убыванию и помечает recommended=true для топ-трети по баллу (но не более 10 вариантов).
 */
export function rankAndFilter(
  variants: RawVariant[],
  scores: VariantScoreResponse[]
): AltApplicationVariant[] {
  const scoreByIndex = new Map<number, VariantScoreResponse>();
  scores.forEach((s) => scoreByIndex.set(s.index, s));

  const ranked: AltApplicationVariant[] = variants.map((v, i) => {
    const s = scoreByIndex.get(i);
    const feasibility = normalizeLevel(s?.feasibility);
    const technicalFeasibility = normalizeLevel(s?.technicalFeasibility);
    const economicFeasibility = normalizeLevel(s?.economicFeasibility);
    const totalScore = SCORE_MAP[feasibility] + SCORE_MAP[technicalFeasibility] + SCORE_MAP[economicFeasibility];

    return {
      description: v.description,
      type: v.type,
      parentFunction: v.parentFunction,
      scores: { feasibility, technicalFeasibility, economicFeasibility },
      totalScore,
      recommended: false,
    };
  });

  ranked.sort((a, b) => b.totalScore - a.totalScore);

  const recommendedCount = Math.min(10, Math.floor(ranked.length / 3));
  for (let i = 0; i < recommendedCount; i++) {
    ranked[i].recommended = true;
  }

  return ranked;
}
