import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSession, isSessionExpired } from '@/lib/wizard-sessions';
import { WIZARD_FIELD_ORDER } from '@/lib/wizard-prompts';

export const dynamic = 'force-dynamic';

// GET /api/utc/wizard/session/[wizardSessionId] — получить текущее состояние сессии мастера
// (для восстановления диалога, например после обновления страницы).
export async function GET(
  _request: NextRequest,
  { params }: { params: { wizardSessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Требуется аутентификация' }, { status: 401 });
    }

    const wizardSession = getSession(params.wizardSessionId);
    if (!wizardSession) {
      return NextResponse.json(
        { error: 'Сессия мастера не найдена или истекла', expired: true },
        { status: 404 }
      );
    }
    if (wizardSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ к чужой сессии запрещён' }, { status: 403 });
    }
    if (isSessionExpired(wizardSession)) {
      return NextResponse.json(
        { error: 'Сессия мастера истекла (более 1 часа)', expired: true },
        { status: 410 }
      );
    }

    return NextResponse.json({
      wizardSessionId: wizardSession.id,
      messages: wizardSession.messages,
      currentStep: wizardSession.currentStep,
      totalSteps: WIZARD_FIELD_ORDER.length,
      isComplete: wizardSession.isComplete,
      extractedData: wizardSession.extractedData,
    });
  } catch (error) {
    console.error('Ошибка получения сессии AI-мастера:', error);
    return NextResponse.json(
      { error: 'Не удалось получить состояние сессии' },
      { status: 500 }
    );
  }
}
