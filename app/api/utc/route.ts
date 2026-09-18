
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// GET - Получить все записи УТК с фильтрацией и поиском
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const organization = searchParams.get('organization') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query
          ? {
              OR: [
                { organization: { contains: query, mode: 'insensitive' as const } },
                { keyProduct: { contains: query, mode: 'insensitive' as const } },
                { purpose: { contains: query, mode: 'insensitive' as const } },
                { categories: { contains: query, mode: 'insensitive' as const } },
                { principle: { contains: query, mode: 'insensitive' as const } },
                { advantages: { contains: query, mode: 'insensitive' as const } },
                { owner: { contains: query, mode: 'insensitive' as const } },
                { formulation: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {},
        organization
          ? {
              organization: { contains: organization, mode: 'insensitive' as const },
            }
          : {},
      ],
    };

    const [records, total] = await Promise.all([
      prisma.uTCRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.uTCRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Ошибка получения записей УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка получения записей УТК' },
      { status: 500 }
    );
  }
}

// POST - Создать новую запись УТК
export async function POST(request: NextRequest) {
  try {
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
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания записи УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка создания записи УТК' },
      { status: 500 }
    );
  }
}
