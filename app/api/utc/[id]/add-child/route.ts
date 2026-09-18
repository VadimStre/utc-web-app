
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// POST - Быстро добавить дочерний узел (ELEMENT/PROCESS) к указанному родителю.
// Требует canEdit на родительскую запись (автор родителя или ADMIN).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    const parentId = parseInt(params.id);
    if (isNaN(parentId)) {
      return NextResponse.json({ error: 'Неверный ID родительской записи' }, { status: 400 });
    }

    const parent = await prisma.uTCRecord.findUnique({ where: { id: parentId } });
    if (!parent) {
      return NextResponse.json({ error: 'Родительская запись не найдена' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = parent.ownerId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Недостаточно прав для добавления дочернего узла к этой записи' },
        { status: 403 }
      );
    }

    const data = await request.json();

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

    const nodeType = data.nodeType;
    if (nodeType !== 'ELEMENT' && nodeType !== 'PROCESS') {
      return NextResponse.json(
        { error: 'nodeType для дочернего узла должен быть ELEMENT или PROCESS' },
        { status: 400 }
      );
    }

    const record = await prisma.uTCRecord.create({
      data: {
        organization: data.organization.trim(),
        keyProduct: data.keyProduct.trim(),
        purpose: data.purpose.trim(),
        categories: data.categories.trim(),
        principle: data.principle.trim(),
        advantages: data.advantages.trim(),
        owner: data.owner.trim(),
        formulation: data.formulation.trim(),
        ownerId: session.user.id,
        nodeType,
        parentId,
        decompositionCharacteristic: data.decompositionCharacteristic
          ? String(data.decompositionCharacteristic).trim()
          : null,
      },
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json({ ...record, canEdit: true }, { status: 201 });
  } catch (error) {
    console.error('Ошибка добавления дочернего узла УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка добавления дочернего узла УТК' },
      { status: 500 }
    );
  }
}
