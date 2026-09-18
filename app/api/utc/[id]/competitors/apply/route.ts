import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { CompetitorInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

function formatCompetitorBlock(selected: CompetitorInfo[], additionalCharacteristics?: string): string {
  const lines: string[] = [];
  lines.push('Сравнение с конкурентами (по данным веб-поиска, проверено на достоверность):');
  for (const c of selected) {
    const source = c.sourceUrl ? ` (источник: ${c.sourceUrl})` : '';
    if (c.characteristics.length === 0) {
      lines.push(`- ${c.companyName}, продукт ${c.product || 'не указан'}${source}`);
    } else {
      for (const char of c.characteristics) {
        lines.push(
          `- ${c.companyName}, продукт ${c.product || 'не указан'}: ${char.name} = ${char.value}${source}`
        );
      }
    }
  }
  if (additionalCharacteristics && additionalCharacteristics.trim()) {
    lines.push(`Дополнительно: ${additionalCharacteristics.trim()}`);
  }
  return lines.join('\n');
}

// POST /api/utc/[id]/competitors/apply — дописать выбранных конкурентов в поле advantages
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

    const record = await prisma.uTCRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: 'Запись УТК не найдена' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = record.ownerId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Недостаточно прав для изменения этой записи' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
    }

    const selected: CompetitorInfo[] = Array.isArray(body?.selectedCompetitors)
      ? body.selectedCompetitors
      : [];

    if (selected.length === 0) {
      return NextResponse.json(
        { error: 'Не выбрано ни одного конкурента для добавления' },
        { status: 400 }
      );
    }

    const additionalCharacteristics =
      typeof body?.additionalCharacteristics === 'string' ? body.additionalCharacteristics : undefined;

    const block = formatCompetitorBlock(selected, additionalCharacteristics);
    const currentAdvantages = record.advantages || '';
    const newAdvantages = currentAdvantages.trim()
      ? `${currentAdvantages.trim()}\n\n${block}`
      : block;

    const updated = await prisma.uTCRecord.update({
      where: { id },
      data: { advantages: newAdvantages },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json({ ...updated, canEdit: true });
  } catch (error) {
    console.error('Ошибка добавления конкурентов в таблицу сравнения:', error);
    return NextResponse.json(
      { error: 'Ошибка добавления конкурентов в таблицу сравнения' },
      { status: 500 }
    );
  }
}
