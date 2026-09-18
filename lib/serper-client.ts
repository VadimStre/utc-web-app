// Обёртка над fetch для вызова Serper.dev (Google Search API) — поиск конкурентов-аналогов.

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export class SerperApiError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = 'SerperApiError';
    this.status = status;
  }
}

/**
 * Выполняет веб-поиск через Serper.dev и возвращает массив organic-результатов.
 * Не бросает "сырые" исключения наружу за пределами этого модуля вызывающему коду —
 * все ошибки оборачиваются в SerperApiError с понятным сообщением на русском.
 */
export async function searchCompetitors(query: string): Promise<SerperOrganicResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-serper-api-key-here') {
    throw new SerperApiError(
      'Поиск конкурентов недоступен: не настроен ключ SERPER_API_KEY на сервере.',
      503
    );
  }

  if (!query || query.trim() === '') {
    throw new SerperApiError('Поиск конкурентов недоступен: пустой поисковый запрос.', 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let response: Response;
  try {
    response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Поиск конкурентов недоступен: превышено время ожидания ответа от Serper.dev.'
        : 'Поиск конкурентов недоступен: не удалось соединиться с Serper.dev.';
    throw new SerperApiError(message, 503);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new SerperApiError(
        'Поиск конкурентов недоступен: неверный или просроченный ключ Serper.dev API.',
        503
      );
    }
    const bodyText = await response.text().catch(() => '');
    throw new SerperApiError(
      `Поиск конкурентов недоступен: Serper.dev вернул ошибку (${response.status}). ${bodyText.slice(0, 200)}`,
      503
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new SerperApiError('Поиск конкурентов недоступен: некорректный ответ от Serper.dev.', 503);
  }

  const organic = Array.isArray(data?.organic) ? data.organic : [];

  return organic
    .filter((item: any) => item && typeof item.link === 'string')
    .map((item: any, index: number) => ({
      title: typeof item.title === 'string' ? item.title : '',
      link: item.link,
      snippet: typeof item.snippet === 'string' ? item.snippet : '',
      position: typeof item.position === 'number' ? item.position : index + 1,
    }));
}
