
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Получить конкретную запись УТК (доступно всем)
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
      return NextResponse.json(
        { error: 'Неверный ID записи' },
        { status: 400 }
      );
    }

    const record = await prisma.uTCRecord.findUnique({
      where: { id },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Запись УТК не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...record,
      canEdit: isAdmin || (!!currentUserId && record.ownerId === currentUserId),
    });
  } catch (error) {
    console.error('Ошибка получения записи УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка получения записи УТК' },
      { status: 500 }
    );
  }
}

async function checkCanModify(id: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { allowed: false, status: 401, error: 'Требуется аутентификация' } as const;
  }

  const record = await prisma.uTCRecord.findUnique({ where: { id } });

  if (!record) {
    return { allowed: false, status: 404, error: 'Запись УТК не найдена' } as const;
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = record.ownerId === session.user.id;

  if (!isAdmin && !isOwner) {
    return { allowed: false, status: 403, error: 'Недостаточно прав для изменения этой записи' } as const;
  }

  return { allowed: true } as const;
}

// PUT - Обновить запись УТК (только владелец записи или ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID записи' },
        { status: 400 }
      );
    }

    const check = await checkCanModify(id);
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const data = await request.json();

    // Валидация обязательных полей
    const requiredFields = [
      'organization',
      'keyProduct',
      'purpose',
      'categories',
      'principle',
      'advantages',
      'owner',
      'formulation',
    ];

    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        return NextResponse.json(
          { error: `Поле "${field}" является обязательным` },
          { status: 400 }
        );
      }
    }

    const record = await prisma.uTCRecord.update({
      where: { id },
      data: {
        organization: data.organization.trim(),
        keyProduct: data.keyProduct.trim(),
        purpose: data.purpose.trim(),
        categories: data.categories.trim(),
        principle: data.principle.trim(),
        advantages: data.advantages.trim(),
        owner: data.owner.trim(),
        formulation: data.formulation.trim(),
      },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json({ ...record, canEdit: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Запись УТК не найдена' },
        { status: 404 }
      );
    }
    console.error('Ошибка обновления записи УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления записи УТК' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить запись УТК (только владелец записи или ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID записи' },
        { status: 400 }
      );
    }

    const check = await checkCanModify(id);
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    await prisma.uTCRecord.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Запись УТК успешно удалена' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Запись УТК не найдена' },
        { status: 404 }
      );
    }
    console.error('Ошибка удаления записи УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления записи УТК' },
      { status: 500 }
    );
  }
}
