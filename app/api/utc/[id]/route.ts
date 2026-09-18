
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

    // Иерархия (Этап 2): опциональное обновление parentId/nodeType/decompositionCharacteristic.
    const updateData: Record<string, unknown> = {
      organization: data.organization.trim(),
      keyProduct: data.keyProduct.trim(),
      purpose: data.purpose.trim(),
      categories: data.categories.trim(),
      principle: data.principle.trim(),
      advantages: data.advantages.trim(),
      owner: data.owner.trim(),
      formulation: data.formulation.trim(),
    };

    if (Object.prototype.hasOwnProperty.call(data, 'decompositionCharacteristic')) {
      updateData.decompositionCharacteristic = data.decompositionCharacteristic
        ? String(data.decompositionCharacteristic).trim()
        : null;
    }

    let newParentId: number | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(data, 'parentId')) {
      if (data.parentId === null || data.parentId === '' || data.parentId === undefined) {
        newParentId = null;
      } else {
        const parsedParentId = Number(data.parentId);
        if (!Number.isInteger(parsedParentId)) {
          return NextResponse.json({ error: 'Некорректный parentId' }, { status: 400 });
        }
        newParentId = parsedParentId;
      }
    }

    let newNodeType: 'PRODUCT' | 'ELEMENT' | 'PROCESS' | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(data, 'nodeType') && data.nodeType) {
      if (!['PRODUCT', 'ELEMENT', 'PROCESS'].includes(data.nodeType)) {
        return NextResponse.json({ error: 'Некорректный nodeType' }, { status: 400 });
      }
      newNodeType = data.nodeType;
    }

    if (newParentId !== undefined) {
      if (newParentId === id) {
        return NextResponse.json(
          { error: 'Узел не может быть своим собственным родителем' },
          { status: 400 }
        );
      }

      if (newParentId !== null) {
        const newParent = await prisma.uTCRecord.findUnique({ where: { id: newParentId } });
        if (!newParent) {
          return NextResponse.json({ error: 'Родительская запись не найдена' }, { status: 400 });
        }

        // Защита от циклов: пройти вверх от newParentId до корня и убедиться, что id
        // (текущий узел) не встречается среди предков — иначе узел стал бы потомком самого себя.
        let ancestorId: number | null = newParent.parentId;
        const visited = new Set<number>([newParentId]);
        while (ancestorId !== null) {
          if (ancestorId === id) {
            return NextResponse.json(
              { error: 'Обнаружен цикл: узел не может стать потомком самого себя' },
              { status: 400 }
            );
          }
          if (visited.has(ancestorId)) break; // защита от зацикливания при повреждённых данных
          visited.add(ancestorId);
          const ancestor: { parentId: number | null } | null = await prisma.uTCRecord.findUnique({
            where: { id: ancestorId },
            select: { parentId: true },
          });
          if (!ancestor) break;
          ancestorId = ancestor.parentId;
        }
      }

      updateData.parentId = newParentId;
    }

    if (newNodeType !== undefined) {
      updateData.nodeType = newNodeType;
    }

    // Согласованность типа/родителя после применения изменений
    const effectiveParentId = newParentId !== undefined ? newParentId : (await prisma.uTCRecord.findUnique({ where: { id }, select: { parentId: true } }))?.parentId ?? null;
    const effectiveNodeType = newNodeType !== undefined ? newNodeType : (await prisma.uTCRecord.findUnique({ where: { id }, select: { nodeType: true } }))?.nodeType;

    if (effectiveParentId === null && effectiveNodeType !== 'PRODUCT' && newNodeType === undefined && newParentId !== undefined) {
      // Родитель убран, а тип не PRODUCT и явно не задан новый тип — переводим в PRODUCT (стал корнем).
      updateData.nodeType = 'PRODUCT';
    } else if (effectiveParentId === null && effectiveNodeType !== 'PRODUCT' && newNodeType !== undefined) {
      return NextResponse.json(
        { error: 'Корневая запись (без parentId) должна иметь nodeType = PRODUCT' },
        { status: 400 }
      );
    } else if (effectiveParentId !== null && effectiveNodeType === 'PRODUCT') {
      return NextResponse.json(
        { error: 'Дочерняя запись (с parentId) должна иметь nodeType = ELEMENT или PROCESS' },
        { status: 400 }
      );
    }

    const record = await prisma.uTCRecord.update({
      where: { id },
      data: updateData,
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
