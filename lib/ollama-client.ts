// Клиент для вызова локальной LLM через Ollama REST API (Этап 6).

import type { ChatMessage } from '@/lib/types';

export class OllamaApiError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = 'OllamaApiError';
    this.status = status;
  }
}

interface CallOllamaOptions {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
}

/**
 * Вызывает Ollama /api/chat с указанным списком сообщений.
 * Бросает OllamaApiError при любой ошибке (connection refused, timeout, невалидный ответ).
 */
export async function callOllama(
  messages: ChatMessage[],
  options: CallOllamaOptions
): Promise<string> {
  const { baseUrl, model, timeoutMs = 60000 } = options;
  const url = `${baseUrl.replace(/\/+$/, '')}/api/chat`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? `Локальная LLM (Ollama) не ответила в течение ${Math.round(timeoutMs / 1000)}с по адресу ${baseUrl}. Убедитесь что Ollama запущен и модель \"${model}\" загружена.`
        : `Локальная LLM (Ollama) недоступна по адресу ${baseUrl}. Убедитесь что Ollama запущен.`;
    throw new OllamaApiError(message, 503);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new OllamaApiError(
      `Ollama вернул ошибку (${response.status}). ${bodyText.slice(0, 300)}`,
      503
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new OllamaApiError('Некорректный ответ от Ollama (невалидный JSON).', 503);
  }

  const content = data?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new OllamaApiError('Пустой ответ от Ollama.', 503);
  }

  return content.trim();
}
