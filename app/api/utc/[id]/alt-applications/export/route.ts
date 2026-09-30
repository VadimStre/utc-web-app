import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import type { AltApplicationsResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FEASIBILITY_LABELS: Record<string, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
};

const SCORE_LABELS: Record<string, string> = {
  feasibility: 'Физ. реализуемость',
  technicalFeasibility: 'Техн. целесообразность',
  economicFeasibility: 'Экон. целесообразность',
};

// POST /api/utc/[id]/alt-applications/export
// Генерирует .docx с результатами поиска альтернативных областей применения.
// Результат принимается из тела запроса (уже вычислен клиентом) — LLM-запросы не повторяются.
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

    // Доступ только автору записи или администратору (как в POST alt-applications).
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = record.ownerId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Доступ только для автора записи или администратора' },
        { status: 403 }
      );
    }

    let result: AltApplicationsResult;
    try {
      const body = await request.json();
      const candidate = body?.result as AltApplicationsResult | undefined;
      if (
        !candidate ||
        !Array.isArray(candidate.alternativeObjects) ||
        !Array.isArray(candidate.newFunctions) ||
        !Array.isArray(candidate.allVariantsRanked)
      ) {
        return NextResponse.json(
          { error: 'Некорректный результат: ожидается { result: AltApplicationsResult }' },
          { status: 400 }
        );
      }
      result = candidate;
    } catch {
      return NextResponse.json(
        { error: 'Некорректный JSON в теле запроса' },
        { status: 400 }
      );
    }

    const children: Paragraph[] = [];

    // Заголовок документа
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun('Поиск альтернативных областей применения')],
      })
    );
    children.push(new Paragraph({ text: '' }));

    // Поле 8: Формулировка УТК
    children.push(new Paragraph({ text: '', spacing: { before: 200 } }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun('8. Формулировка УТК')],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun(record.formulation || '—')],
      })
    );

    // Новые области для той же Функции
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Новые области для той же Функции (${result.alternativeObjects.length})`)],
      })
    );
    if (result.alternativeObjects.length === 0) {
      children.push(new Paragraph({ children: [new TextRun('Нет данных')] }));
    } else {
      result.alternativeObjects.forEach((obj) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(obj)],
          })
        );
      });
    }

    // Новые типы Продуктов
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Новые типы Продуктов (${result.newFunctions.length})`)],
      })
    );
    if (result.newFunctions.length === 0) {
      children.push(new Paragraph({ children: [new TextRun('Нет данных')] }));
    } else {
      result.newFunctions.forEach((nf, i) => {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200 },
            children: [new TextRun(`${i + 1}. ${nf.function}`)],
          })
        );
        if (nf.objects.length === 0) {
          children.push(new Paragraph({ children: [new TextRun('Нет объектов')] }));
        } else {
          nf.objects.forEach((obj) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun(obj)],
              })
            );
          });
        }
      });
    }

    // Сводный рейтинг всех вариантов
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Сводный рейтинг всех вариантов (${result.allVariantsRanked.length})`)],
      })
    );
    if (result.allVariantsRanked.length === 0) {
      children.push(new Paragraph({ children: [new TextRun('Нет данных')] }));
    } else {
      result.allVariantsRanked.forEach((v, i) => {
        const lines: TextRun[] = [];
        lines.push(
          new TextRun({
            text: `${i + 1}. ${v.description}`,
            bold: true,
          })
        );
        lines.push(
          new TextRun({
            text: `  — Балл: ${v.totalScore}/9  ${
              v.recommended ? '[Рекомендовано]' : ''
            }`.trimEnd(),
            italics: true,
          })
        );
        children.push(
          new Paragraph({
            spacing: { before: 200 },
            children: lines,
          })
        );
        for (const key of ['feasibility', 'technicalFeasibility', 'economicFeasibility'] as const) {
          const label = SCORE_LABELS[key];
          const value = v.scores?.[key];
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [
                new TextRun({
                  text: `${label}: ${value ? FEASIBILITY_LABELS[value] ?? value : '—'}`,
                }),
              ],
            })
          );
        }
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const exported = Buffer.from(buffer);
    const filename = `utc-alt-applications-${id}.docx`;

    return new NextResponse(exported, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(exported.length),
      },
    });
  } catch (error) {
    console.error('Ошибка экспорта альтернативных применений в .docx:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта альтернативных применений в .docx' },
      { status: 500 }
    );
  }
}
