
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Непосредственные дети указанного узла (для потенциальной ленивой подгрузки).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const isAdmin = session?.user?.role === 'ADMIN';

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Неверный ID записи' }, { status: 400 });
    }

    const parent = await prisma.uTCRecord.findUnique({ where: { id } });
    if (!parent) {
      return NextResponse.json({ error: 'Запись УТК не найдена' }, { status: 404 });
    }

    const children = await prisma.uTCRecord.findMany({
      where: { parentId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    const childrenWithPermissions = children.map((record) => ({
      ...record,
      canEdit: isAdmin || (!!currentUserId && record.ownerId === currentUserId),
    }));

    return NextResponse.json({ children: childrenWithPermissions });
  } catch (error) {
    console.error('Ошибка получения дочерних записей УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка получения дочерних записей УТК' },
      { status: 500 }
    );
  }
}
