// API для управления глобальными настройками LLM (Этап 6).
// Доступен только администраторам (role === 'ADMIN').

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 }) };
  }
  if ((session.user as any).role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 }) };
  }
  return { session };
}

async function getOrCreateSettings() {
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

// GET /api/admin/llm-settings — текущие настройки LLM
export async function GET() {
  const auth = await getAdminSession();
  if (auth.error) return auth.error;

  const settings = await getOrCreateSettings();
  return NextResponse.json({
    llmProvider: settings.llmProvider,
    localLlmBaseUrl: settings.localLlmBaseUrl || 'http://localhost:11434',
    localLlmModel: settings.localLlmModel || 'llama3.1',
  });
}

// PUT /api/admin/llm-settings — обновить настройки LLM
export async function PUT(request: NextRequest) {
  const auth = await getAdminSession();
  if (auth.error) return auth.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Невалидный JSON' }, { status: 400 });
  }

  const { llmProvider, localLlmBaseUrl, localLlmModel } = body;

  if (!llmProvider || !['cloud', 'local'].includes(llmProvider)) {
    return NextResponse.json(
      { error: 'Поле llmProvider должно быть "cloud" или "local"' },
      { status: 400 }
    );
  }

  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {
      llmProvider,
      ...(typeof localLlmBaseUrl === 'string' && { localLlmBaseUrl }),
      ...(typeof localLlmModel === 'string' && { localLlmModel }),
      updatedById: auth.session!.user!.id,
    },
    create: {
      id: 1,
      llmProvider,
      localLlmBaseUrl: typeof localLlmBaseUrl === 'string' ? localLlmBaseUrl : 'http://localhost:11434',
      localLlmModel: typeof localLlmModel === 'string' ? localLlmModel : 'llama3.1',
      updatedById: auth.session!.user!.id,
    },
  });

  return NextResponse.json({
    llmProvider: settings.llmProvider,
    localLlmBaseUrl: settings.localLlmBaseUrl || 'http://localhost:11434',
    localLlmModel: settings.localLlmModel || 'llama3.1',
  });
}
