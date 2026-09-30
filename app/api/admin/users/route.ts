// API для просмотра пользователей и их УТК (R11).
// Доступен только администраторам (role === 'ADMIN').

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 }) };
  }
  if ((session.user as any).role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 }) };
  }
  return { session };
}

// GET /api/admin/users — список пользователей с их УТК
export async function GET() {
  const auth = await getAdminSession();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    include: {
      records: {
        select: {
          id: true,
          formulation: true,
          keyProduct: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}
