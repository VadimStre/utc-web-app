
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderUtcHtmlList } from '@/lib/export-html';

export const dynamic = "force-dynamic";

// GET - Экспорт записей УТК в HTML или JSON
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

    if (format === 'html') {
      const htmlContent = renderUtcHtmlList(records);

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'attachment; filename="utc_records.html"',
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
