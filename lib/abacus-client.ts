// Обёртка над fetch для вызова Abacus.ai RouteLLM (OpenAI-совместимый Chat Completions API).

import type { ChatMessage } from '@/lib/types';

const DEFAULT_BASE_URL = 'https://routellm.abacus.ai/v1';
const DEFAULT_MODEL = 'route-llm';

export class AbacusApiError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = 'AbacusApiError';
    this.status = status;
  }
}

interface CallAbacusOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Вызывает Abacus.ai RouteLLM chat/completions с указанным списком сообщений.
 * Бросает AbacusApiError (со статусом для проброса клиенту) при любой ошибке:
 * отсутствие ключа, сетевая ошибка, невалидный ответ, таймаут.
 */
export async function callAbacus(
  messages: ChatMessage[],
  options: CallAbacusOptions = {}
): Promise<string> {
  const apiKey = process.env.ABACUS_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-abacus-api-key-here') {
    throw new AbacusApiError(
      'AI-мастер недоступен: не настроен ключ ABACUS_API_KEY на сервере.',
      503
    );
  }

  const baseUrl = (process.env.ABACUS_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const model = process.env.ABACUS_MODEL || DEFAULT_MODEL;
  const { temperature = 0.7, maxTokens = 500, timeoutMs = 30000 } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'AI-мастер недоступен: превышено время ожидания ответа от Abacus.ai.'
        : 'AI-мастер недоступен: не удалось соединиться с Abacus.ai.';
    throw new AbacusApiError(message, 503);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AbacusApiError(
        'AI-мастер недоступен: неверный или просроченный ключ Abacus.ai API.',
        503
      );
    }
    const bodyText = await response.text().catch(() => '');
    throw new AbacusApiError(
      `AI-мастер недоступен: Abacus.ai вернул ошибку (${response.status}). ${bodyText.slice(0, 200)}`,
      503
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new AbacusApiError('AI-мастер недоступен: некорректный ответ от Abacus.ai.', 503);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new AbacusApiError('AI-мастер недоступен: пустой ответ от Abacus.ai.', 503);
  }

  return content.trim();
}
