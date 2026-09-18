
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// GET - Экспорт записей УТК в CSV или JSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const query = searchParams.get('query') || '';
    const organization = searchParams.get('organization') || '';

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

    const records = await prisma.uTCRecord.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID',
        'Организация',
        'Ключевой продукт',
        'Назначение',
        'Категории',
        'Принцип действия',
        'Преимущества',
        'Владелец',
        'Формулировка УТК',
        'Дата создания',
        'Дата обновления',
      ];

      const csvRows = records.map((record) => [
        record.id,
        `"${record.organization.replace(/"/g, '""')}"`,
        `"${record.keyProduct.replace(/"/g, '""')}"`,
        `"${record.purpose.replace(/"/g, '""')}"`,
        `"${record.categories.replace(/"/g, '""')}"`,
        `"${record.principle.replace(/"/g, '""')}"`,
        `"${record.advantages.replace(/"/g, '""')}"`,
        `"${record.owner.replace(/"/g, '""')}"`,
        `"${record.formulation.replace(/"/g, '""')}"`,
        record.createdAt.toISOString(),
        record.updatedAt.toISOString(),
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="utc_records.csv"',
        },
      });
    }

    // JSON формат
    return NextResponse.json(records, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="utc_records.json"',
      },
    });
  } catch (error) {
    console.error('Ошибка экспорта записей УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта записей УТК' },
      { status: 500 }
    );
  }
}
