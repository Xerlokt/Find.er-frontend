import type { ChatListItem, ChatMessage } from '../api/chat';

export const CHAT_MAX_LENGTH = 5000;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

export const chatWsUrl = (apiUrl: string, chatId: string) =>
  `${apiUrl.replace(/^http/, 'ws').replace(/\/$/, '')}/chats/${chatId}/ws`;

/** Junta histórico e mensagens ao vivo: sem repetir id (o servidor devolve a mensagem ao próprio remetente), mais nova primeiro. */
export function mergeMessages(history: ChatMessage[], live: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of [...history, ...live]) {
    // a última versão vence, mas a confirmação de leitura nunca regride (o eco ao vivo chega com readAt null)
    const prev = byId.get(m.id);
    byId.set(m.id, prev?.readAt && !m.readAt ? { ...m, readAt: prev.readAt } : m);
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Regra do backend (RECRUITER_MUST_INITIATE): o candidato só escreve depois de o recrutador enviar a 1ª mensagem. */
export const canCandidateSend = (messages: ChatMessage[], recruiterUserId: string) =>
  messages.some((m) => m.senderId === recruiterUserId);

export function validateOutgoing(text: string): { ok: true; content: string } | { ok: false } {
  const content = text.trim();
  return content.length >= 1 && content.length <= CHAT_MAX_LENGTH ? { ok: true, content } : { ok: false };
}

export type SocketPayload = { type: 'message'; message: ChatMessage } | { type: 'error'; code: string } | { type: 'ignore' };

export function parseSocketPayload(raw: string): SocketPayload {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { type: 'ignore' };
  }
  if (!data || typeof data !== 'object') return { type: 'ignore' };
  const o = data as Record<string, unknown>;
  const isMessage = ['id', 'chatId', 'senderId', 'content', 'createdAt'].every((k) => typeof o[k] === 'string');
  if (isMessage) return { type: 'message', message: data as ChatMessage };
  if (typeof o.error === 'string') return { type: 'error', code: o.error };
  return { type: 'ignore' };
}

export function socketErrorMessage(code: string): string {
  switch (code) {
    case 'RECRUITER_MUST_INITIATE':
      return 'aguarde o recrutador iniciar a conversa';
    case 'INVALID_PAYLOAD':
      return 'mensagem inválida: escreva de 1 a 5000 caracteres';
    case 'NOT_PARTICIPANT':
    case 'FORBIDDEN':
      return 'você não tem permissão pra essa conversa';
    case 'UNAUTHENTICATED':
      return 'sua sessão expirou, entra de novo';
    default:
      return 'não foi possível enviar, tenta de novo';
  }
}

/** Espera antes da tentativa `attempt` (0 = 1ª): 1s, 2s, 4s… limitado a 30s. */
export const backoffMs = (attempt: number) => Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);

export const otherParticipantName = (chat: ChatListItem, userId: string | null) =>
  chat.candidateUserId === userId ? chat.companyName : chat.candidateName;
