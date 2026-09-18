import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteSession, getSession } from '@/lib/wizard-sessions';
import type { ExtractedUtcData } from '@/lib/types';

export const dynamic = 'force-dynamic';

const REQUIRED_FIELDS: (keyof ExtractedUtcData)[] = [
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

// POST /api/utc/wizard/submit — создаёт запись УТК на основе данных, собранных мастером.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const wizardSessionId = body?.wizardSessionId;
    const extractedData = body?.extractedData as Partial<ExtractedUtcData> | undefined;

    if (!extractedData || typeof extractedData !== 'object') {
      return NextResponse.json({ error: 'Отсутствуют данные для создания записи' }, { status: 400 });
    }

    for (const field of REQUIRED_FIELDS) {
      const value = extractedData[field];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        return NextResponse.json(
          { error: `Поле "${field}" является обязательным для создания записи УТК` },
          { status: 400 }
        );
      }
    }

    // Если сессия ещё существует и принадлежит текущему пользователю — сверим владельца.
    if (wizardSessionId && typeof wizardSessionId === 'string') {
      const wizardSession = getSession(wizardSessionId);
      if (wizardSession && wizardSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Доступ к чужой сессии запрещён' }, { status: 403 });
      }
    }

    // Дополнительные поля мастера (customerProblem, targetIndustry) сохраняем внутри
    // существующего поля `purpose`/`advantages`, чтобы не менять схему БД из Этапов 1-2:
    // формируем итоговое описание, дописывая проблему и отрасль в конец соответствующих полей.
    const purposeWithProblem = `${extractedData.purpose!.trim()}\n\nПроблема покупателя: ${extractedData.customerProblem!.trim()}`;
    const categoriesWithIndustry = `${extractedData.categories!.trim()}\n\nЦелевая отрасль: ${extractedData.targetIndustry!.trim()}`;

    const record = await prisma.uTCRecord.create({
      data: {
        organization: extractedData.organization!.trim(),
        keyProduct: extractedData.keyProduct!.trim(),
        purpose: purposeWithProblem,
        categories: categoriesWithIndustry,
        principle: extractedData.principle!.trim(),
        advantages: extractedData.advantages!.trim(),
        owner: extractedData.owner!.trim(),
        formulation: extractedData.formulation!.trim(),
        ownerId: session.user.id,
        nodeType: 'PRODUCT',
        parentId: null,
      },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (wizardSessionId && typeof wizardSessionId === 'string') {
      deleteSession(wizardSessionId);
    }

    return NextResponse.json({ ...record, canEdit: true }, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания записи УТК через AI-мастер:', error);
    return NextResponse.json(
      { error: 'Ошибка создания записи УТК' },
      { status: 500 }
    );
  }
}
