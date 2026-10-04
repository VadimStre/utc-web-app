
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Вернуть полное дерево записей УТК (все узлы, вложенные по parentId).
// Дерево строится в JS из плоского списка (без рекурсивных SQL-запросов).
//
// Ранжирование корневых узлов (Продуктов) — по «активности поддерева»:
// самая свежая дата обновления среди (сам корень + все его потомки), по убыванию.
// То есть Продукт, чей ребёнок или внук редактировался последним, уходит наверх —
// как в Таблице «новые редактированные сначала». Узлы-сироты (без валидного parentId)
// трактуются как корневые. Дети внутри корня остаются по порядку добавления
// (createdAt asc), чтобы структура дерева не «прыгала» при правке.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const isAdmin = session?.user?.role === 'ADMIN';

    const records = await prisma.uTCRecord.findMany({
      include: {
        ownerUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    type NodeWithChildren = (typeof records)[number] & { canEdit: boolean; children: NodeWithChildren[] };

    const nodesById = new Map<number, NodeWithChildren>();
    for (const record of records) {
      nodesById.set(record.id, {
        ...record,
        canEdit: isAdmin || (!!currentUserId && record.ownerId === currentUserId),
        children: [],
      });
    }

    const roots: NodeWithChildren[] = [];
    // Сначала по всем узлам: собираем корни, раскладываем детей по parentId.
    // Дети внутри каждого родителя — в порядке добавления (как были в списке records).
    for (const node of Array.from(nodesById.values())) {
      if (node.parentId !== null && nodesById.has(node.parentId)) {
        nodesById.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // «Активность поддерева» корня = max(updatedAt) по самому корню и его потомкам (рекурсивно).
    function subtreeMaxUpdated(node: NodeWithChildren): number {
      let max = node.updatedAt ? new Date(node.updatedAt).getTime() : 0;
      for (const child of node.children) {
        max = Math.max(max, subtreeMaxUpdated(child));
      }
      return max;
    }

    roots.sort((a, b) => subtreeMaxUpdated(b) - subtreeMaxUpdated(a));

    return NextResponse.json({ tree: roots, total: records.length });
  } catch (error) {
    console.error('Ошибка построения дерева УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка построения дерева УТК' },
      { status: 500 }
    );
  }
}
