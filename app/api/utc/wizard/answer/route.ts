import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession, updateSession, isSessionExpired, deleteSession } from '@/lib/wizard-sessions';
import { callAbacus, AbacusApiError } from '@/lib/abacus-client';
import {
  systemPrompt,
  extractionPrompt,
  WIZARD_FIELD_ORDER,
  getNextFieldPrompt,
} from '@/lib/wizard-prompts';
import type { ExtractedUtcData } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TOTAL_QUESTIONS = WIZARD_FIELD_ORDER.length;

function tryParseExtractedJson(raw: string): ExtractedUtcData | null {
  // LLM иногда оборачивает JSON в ```json ... ``` — извлекаем содержимое.
  let text = raw.trim();
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    text = fencedMatch[1].trim();
  }
  // На случай, если модель добавила текст до/после JSON — вырезаем крайние { }.
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    const requiredKeys: (keyof ExtractedUtcData)[] = [
      'organization',
      'keyProduct',
      'purpose',
      'categories',
      'principle',
      'advantages',
      'owner',
      'formulation',
      'customerProblem',
      'targetIndustry',
    ];
    const result: Partial<ExtractedUtcData> = {};
    for (const key of requiredKeys) {
      const value = parsed[key];
      if (typeof value !== 'string' || value.trim() === '') {
        return null;
      }
      result[key] = value.trim();
    }
    return result as ExtractedUtcData;
  } catch {
    return null;
  }
}

// POST /api/utc/wizard/answer — принимает ответ пользователя, генерирует следующий вопрос
// (или финализирует диалог, извлекая структурированные данные), используя Abacus.ai RouteLLM.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const wizardSessionId = body?.wizardSessionId;
    const userAnswer = body?.userAnswer;

    if (!wizardSessionId || typeof wizardSessionId !== 'string') {
      return NextResponse.json({ error: 'Отсутствует wizardSessionId' }, { status: 400 });
    }
    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim() === '') {
      return NextResponse.json({ error: 'Ответ не может быть пустым' }, { status: 400 });
    }

    const wizardSession = getSession(wizardSessionId);
    if (!wizardSession) {
      return NextResponse.json(
        { error: 'Сессия мастера не найдена или истекла. Начните заново.', expired: true },
        { status: 404 }
      );
    }
    if (wizardSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ к чужой сессии запрещён' }, { status: 403 });
    }
    if (isSessionExpired(wizardSession)) {
      deleteSession(wizardSession.id);
      return NextResponse.json(
        { error: 'Сессия мастера истекла (более 1 часа). Начните заново.', expired: true },
        { status: 410 }
      );
    }

    // Записываем ответ пользователя в историю.
    wizardSession.messages.push({ role: 'user', content: userAnswer.trim() });

    const nextStep = wizardSession.currentStep + 1;
    const isLastAnswer = nextStep >= TOTAL_QUESTIONS;

    if (!isLastAnswer) {
      // Просим LLM сформулировать следующий уточняющий вопрос, опираясь на диалог.
      const fallbackQuestion = getNextFieldPrompt(WIZARD_FIELD_ORDER[nextStep]);
      let nextQuestion = fallbackQuestion;

      try {
        const llmMessages = [
          { role: 'assistant' as const, content: systemPrompt },
          ...wizardSession.messages,
          {
            role: 'user' as const,
            content: `Сформулируй следующий вопрос интервью — по теме: "${fallbackQuestion}". Задай только один вопрос, кратко (2-3 предложения), без нумерации и пояснений.`,
          },
        ];
        const llmResponse = await callAbacus(llmMessages as any, { temperature: 0.7, maxTokens: 500 });
        if (llmResponse && llmResponse.trim() !== '') {
          nextQuestion = llmResponse.trim();
        }
      } catch (error) {
        // Если Abacus.ai недоступен — используем заготовленный вопрос из методички,
        // не прерывая диалог для пользователя.
        console.error('Abacus.ai недоступен при генерации вопроса, используем fallback:', error);
      }

      wizardSession.messages.push({ role: 'assistant', content: nextQuestion });
      updateSession(wizardSession.id, {
        messages: wizardSession.messages,
        currentStep: nextStep,
      });

      return NextResponse.json({
        nextQuestion,
        isComplete: false,
        extractedData: null,
        step: nextStep + 1,
        totalSteps: TOTAL_QUESTIONS,
      });
    }

    // Последний ответ получен — извлекаем структурированные данные из всего диалога.
    let extractedData: ExtractedUtcData | null = null;
    let extractionError: string | null = null;

    try {
      const llmMessages = [
        { role: 'assistant' as const, content: systemPrompt },
        ...wizardSession.messages,
        { role: 'user' as const, content: extractionPrompt },
      ];
      const llmResponse = await callAbacus(llmMessages as any, { temperature: 0.2, maxTokens: 800 });
      extractedData = tryParseExtractedJson(llmResponse);
      if (!extractedData) {
        extractionError =
          'AI-мастер не смог разобрать собранные данные в структурированный вид. Пожалуйста, повторите последний ответ или отредактируйте данные вручную после завершения.';
      }
    } catch (error) {
      const message =
        error instanceof AbacusApiError
          ? error.message
          : 'AI-мастер недоступен: не удалось извлечь структурированные данные.';
      extractionError = message;
    }

    updateSession(wizardSession.id, {
      currentStep: nextStep,
      isComplete: extractedData !== null,
      extractedData: extractedData ?? wizardSession.extractedData,
    });

    if (!extractedData) {
      return NextResponse.json({
        nextQuestion: null,
        isComplete: false,
        extractedData: null,
        error: extractionError,
        step: nextStep,
        totalSteps: TOTAL_QUESTIONS,
      }, { status: 200 });
    }

    return NextResponse.json({
      nextQuestion: null,
      isComplete: true,
      extractedData,
      step: TOTAL_QUESTIONS,
      totalSteps: TOTAL_QUESTIONS,
    });
  } catch (error) {
    if (error instanceof AbacusApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Ошибка обработки ответа AI-мастера:', error);
    return NextResponse.json(
      { error: 'Не удалось обработать ответ AI-мастера' },
      { status: 500 }
    );
  }
}
