
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// GET - Получить конкретную запись УТК
export async function GET(
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

    const record = await prisma.uTCRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Запись УТК не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Ошибка получения записи УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка получения записи УТК' },
      { status: 500 }
    );
  }
}

// PUT - Обновить запись УТК
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID записи' },
        { status: 400 }
      );
    }

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
    });

    return NextResponse.json(record);
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

// DELETE - Удалить запись УТК
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
