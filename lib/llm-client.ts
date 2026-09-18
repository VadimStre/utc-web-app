// Единый диспетчер вызовов LLM (Этап 6).
// Читает глобальную настройку llmProvider из БД (AppSettings, singleton id=1)
// и маршрутизирует запрос к облачному (Abacus.ai) или локальному (Ollama) провайдеру.

import type { ChatMessage } from '@/lib/types';
import { prisma } from '@/lib/db';
import { callAbacus, AbacusApiError } from '@/lib/abacus-client';
import { callOllama, OllamaApiError } from '@/lib/ollama-client';

export { AbacusApiError, OllamaApiError };

/** Ошибка LLM — базовый тип для обработки в catch-блоках маршрутов. */
export class LlmApiError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = 'LlmApiError';
    this.status = status;
  }
}

export interface CallLlmOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Получает текущие настройки приложения (upsert singleton id=1).
 */
async function getAppSettings() {
  return prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      llmProvider: 'cloud',
      localLlmBaseUrl: 'http://localhost:11434',
      localLlmModel: 'llama3.1',
    },
  });
}

/**
 * Единая точка входа для вызова LLM.
 * Читает настройки из БД, маршрутизирует к нужному провайдеру, возвращает строку ответа.
 */
export async function callLLM(
  messages: ChatMessage[],
  options: CallLlmOptions = {}
): Promise<string> {
  const settings = await getAppSettings();

  if (settings.llmProvider === 'local') {
    try {
      return await callOllama(messages, {
        baseUrl: settings.localLlmBaseUrl || 'http://localhost:11434',
        model: settings.localLlmModel || 'llama3.1',
        timeoutMs: options.timeoutMs ?? 60000,
      });
    } catch (error) {
      if (error instanceof OllamaApiError) {
        throw new LlmApiError(error.message, error.status);
      }
      throw error;
    }
  }

  // Default: cloud (Abacus.ai)
  try {
    return await callAbacus(messages, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      timeoutMs: options.timeoutMs,
    });
  } catch (error) {
    if (error instanceof AbacusApiError) {
      throw new LlmApiError(error.message, error.status);
    }
    throw error;
  }
}

/**
 * Тестовый вызов конкретного провайдера (без чтения настроек из БД).
 * Используется эндпоинтом /api/admin/llm-settings/test для проверки подключения.
 */
export async function testLlmProvider(
  provider: 'cloud' | 'local',
  localOptions?: { baseUrl?: string; model?: string }
): Promise<{ content: string }> {
  const testMessages: ChatMessage[] = [
    { role: 'user', content: 'Ответь одним словом: тест' },
  ];

  if (provider === 'local') {
    const content = await callOllama(testMessages, {
      baseUrl: localOptions?.baseUrl || 'http://localhost:11434',
      model: localOptions?.model || 'llama3.1',
      timeoutMs: 30000,
    });
    return { content };
  }

  const content = await callAbacus(testMessages, {
    temperature: 0.1,
    maxTokens: 50,
    timeoutMs: 15000,
  });
  return { content };
}
