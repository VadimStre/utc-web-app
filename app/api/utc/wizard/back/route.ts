import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession, goBack, deleteSession, isSessionExpired } from '@/lib/wizard-sessions';
import { FIRST_QUESTION, WIZARD_FIELD_ORDER } from '@/lib/wizard-prompts';

export const dynamic = 'force-dynamic';

const TOTAL_QUESTIONS = WIZARD_FIELD_ORDER.length;

// POST /api/utc/wizard/back — откатывает сессию AI-мастера на один шаг назад:
// currentStep - 1 и удаление последней пары сообщений (user + assistant).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const wizardSessionId = body?.wizardSessionId;

    if (!wizardSessionId || typeof wizardSessionId !== 'string') {
      return NextResponse.json({ error: 'Отсутствует wizardSessionId' }, { status: 400 });
    }

    const wizardSession = getSession(wizardSessionId);
    if (!wizardSession) {
      return NextResponse.json(
        { error: 'Сессия мастера не найдена или истекла. Начните заново.', expired: true },
        { status: 404 }
      );
    }
    if (wizardSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ к чужой сессии запрещён' }, { status: 403 });
    }
    if (isSessionExpired(wizardSession)) {
      deleteSession(wizardSession.id);
      return NextResponse.json(
        { error: 'Сессия мастера истекла (более 1 часа). Начните заново.', expired: true },
        { status: 410 }
      );
    }

    const updated = goBack(wizardSession.id);
    if (!updated) {
      return NextResponse.json({ error: 'Не удалось откатить сессию мастера' }, { status: 500 });
    }

    // Последнее assistant-сообщение после отката — это предыдущий вопрос.
    let question = FIRST_QUESTION;
    for (let i = updated.messages.length - 1; i >= 0; i -= 1) {
      if (updated.messages[i].role === 'assistant') {
        question = updated.messages[i].content;
        break;
      }
    }

    return NextResponse.json({
      question,
      step: updated.currentStep + 1,
      totalSteps: TOTAL_QUESTIONS,
    });
  } catch (error) {
    console.error('Ошибка отката сессии AI-мастера:', error);
    return NextResponse.json(
      { error: 'Не удалось откатить сессию AI-мастера' },
      { status: 500 }
    );
  }
}
