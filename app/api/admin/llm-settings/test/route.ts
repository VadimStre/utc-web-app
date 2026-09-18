// Тестовый эндпоинт для проверки подключения к LLM провайдеру (Этап 6).
// POST /api/admin/llm-settings/test — доступен только ADMIN.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testLlmProvider } from '@/lib/llm-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
  }
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
  }

  const { provider, localLlmBaseUrl, localLlmModel } = body;
  if (!provider || !['cloud', 'local'].includes(provider)) {
    return NextResponse.json(
      { error: 'Поле provider должно быть "cloud" или "local"' },
      { status: 400 }
    );
  }

  const start = Date.now();
  try {
    const result = await testLlmProvider(provider, {
      baseUrl: localLlmBaseUrl,
      model: localLlmModel,
    });
    const latencyMs = Date.now() - start;
    return NextResponse.json({
      success: true,
      message: `Провайдер "${provider}" ответил: "${result.content}"`,
      latencyMs,
    });
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return NextResponse.json({
      success: false,
      message,
      latencyMs,
    });
  }
}
