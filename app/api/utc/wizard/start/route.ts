import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSession } from '@/lib/wizard-sessions';
import { FIRST_QUESTION } from '@/lib/wizard-prompts';

export const dynamic = 'force-dynamic';

// POST /api/utc/wizard/start — инициирует новую сессию AI-мастера ввода УТК.
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const wizardSession = createSession(session.user.id);
    wizardSession.messages.push({ role: 'assistant', content: FIRST_QUESTION });

    return NextResponse.json({
      wizardSessionId: wizardSession.id,
      firstQuestion: FIRST_QUESTION,
    });
  } catch (error) {
    console.error('Ошибка старта AI-мастера:', error);
    return NextResponse.json(
      { error: 'Не удалось запустить AI-мастер' },
      { status: 500 }
    );
  }
}
