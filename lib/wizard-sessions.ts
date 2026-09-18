// In-memory хранилище сессий AI-мастера ввода УТК (MVP, Этап 3).
// ВНИМАНИЕ: хранилище не переживает перезапуск сервера/несколько инстансов —
// для продакшена стоит заменить на Redis/БД, но для MVP этого достаточно.

import { randomUUID } from 'crypto';
import type { WizardSession, ChatMessage, ExtractedUtcData } from '@/lib/types';

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 час

// Используем globalThis, чтобы пережить hot-reload в dev-режиме Next.js.
const globalForWizard = globalThis as unknown as {
  __wizardSessions?: Map<string, WizardSession>;
  __wizardCleanupStarted?: boolean;
};

function getStore(): Map<string, WizardSession> {
  if (!globalForWizard.__wizardSessions) {
    globalForWizard.__wizardSessions = new Map();
  }
  return globalForWizard.__wizardSessions;
}

function cleanupOldSessions() {
  const store = getStore();
  const now = Date.now();
  for (const [id, session] of Array.from(store.entries())) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      store.delete(id);
    }
  }
}

// Запускаем периодическую очистку один раз за жизнь процесса.
function ensureCleanupScheduled() {
  if (!globalForWizard.__wizardCleanupStarted) {
    globalForWizard.__wizardCleanupStarted = true;
    cleanupOldSessions();
    const timer = setInterval(cleanupOldSessions, 15 * 60 * 1000);
    // Не держим процесс живым только из-за таймера очистки.
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }
}

export function createSession(userId: string): WizardSession {
  ensureCleanupScheduled();
  const session: WizardSession = {
    id: randomUUID(),
    userId,
    createdAt: Date.now(),
    messages: [],
    extractedData: {},
    currentStep: 0,
    isComplete: false,
  };
  getStore().set(session.id, session);
  return session;
}

export function getSession(id: string): WizardSession | undefined {
  ensureCleanupScheduled();
  const session = getStore().get(id);
  if (!session) return undefined;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    getStore().delete(id);
    return undefined;
  }
  return session;
}

export function updateSession(
  id: string,
  updates: Partial<Pick<WizardSession, 'messages' | 'extractedData' | 'currentStep' | 'isComplete'>>
): WizardSession | undefined {
  const session = getSession(id);
  if (!session) return undefined;
  Object.assign(session, updates);
  getStore().set(id, session);
  return session;
}

export function appendMessage(id: string, message: ChatMessage): WizardSession | undefined {
  const session = getSession(id);
  if (!session) return undefined;
  session.messages.push(message);
  getStore().set(id, session);
  return session;
}

export function deleteSession(id: string): void {
  getStore().delete(id);
}

export function isSessionExpired(session: WizardSession): boolean {
  return Date.now() - session.createdAt > SESSION_TTL_MS;
}
