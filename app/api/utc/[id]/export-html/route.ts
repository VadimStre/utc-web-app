import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { renderUtcHtmlRecord } from '@/lib/export-html';

export const dynamic = 'force-dynamic';

// GET /api/utc/[id]/export-html
// Скачивание карточки УТК в .html (доступно автору записи или администратору).
export async function GET(
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

    // Доступ только автору записи или администратору (как в alt-applications export).
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = record.ownerId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Доступ только для автора записи или администратора' },
        { status: 403 }
      );
    }

    const htmlContent = renderUtcHtmlRecord(record);

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="utc-${id}.html"`,
        'Content-Length': String(Buffer.byteLength(htmlContent, 'utf-8')),
      },
    });
  } catch (error) {
    console.error('Ошибка экспорта карточки УТК в .html:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта карточки УТК в .html' },
      { status: 500 }
    );
  }
}
