
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

// GET - Вернуть полное дерево записей УТК (все узлы, вложенные по parentId).
// Дерево строится в JS из плоского списка (без рекурсивных SQL-запросов).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const isAdmin = session?.user?.role === 'ADMIN';

    const records = await prisma.uTCRecord.findMany({
      orderBy: { createdAt: 'asc' },
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
    for (const node of Array.from(nodesById.values())) {
      if (node.parentId !== null && nodesById.has(node.parentId)) {
        nodesById.get(node.parentId)!.children.push(node);
      } else {
        // Узел без parentId, либо parentId указывает на несуществующую запись (осиротевший) —
        // трактуем как корневой, чтобы не потерять его из выдачи.
        roots.push(node);
      }
    }

    return NextResponse.json({ tree: roots, total: records.length });
  } catch (error) {
    console.error('Ошибка построения дерева УТК:', error);
    return NextResponse.json(
      { error: 'Ошибка построения дерева УТК' },
      { status: 500 }
    );
  }
}
