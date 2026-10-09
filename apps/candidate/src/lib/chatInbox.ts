import type { ChatListItem, ChatMessage } from '../api/chat';
import { canCandidateSend, mergeMessages } from './chat';

export type InboxItem = { chat: ChatListItem; lastMessage: ChatMessage; messages: ChatMessage[] };

const time = (m: ChatMessage) => Date.parse(m.createdAt);

/**
 * Caixa de entrada do candidato: o like abre o chat no backend, mas ele só aparece quando a empresa
 * já mandou a 1ª mensagem. Mais recente primeiro. Chat com mensagens ainda não carregadas fica oculto.
 */
export function buildInbox(chats: ChatListItem[], messagesByChat: Record<string, ChatMessage[] | undefined>): InboxItem[] {
  const items: InboxItem[] = [];
  for (const chat of chats) {
    const messages = messagesByChat[chat.id];
    if (!messages || !canCandidateSend(messages, chat.recruiterUserId)) continue;
    const lastMessage = messages.reduce((a, b) => (time(b) > time(a) ? b : a));
    items.push({ chat, lastMessage, messages });
  }
  return items.sort((a, b) => time(b.lastMessage) - time(a.lastMessage));
}

export function previewText(message: ChatMessage, userId: string | null): string {
  const text = message.content.replace(/\s+/g, ' ').trim();
  return message.senderId === userId ? `você: ${text}` : text;
}

/** Mensagem que chegou pelo WebSocket entra na prévia do chat (mais nova primeiro, sem repetir id). */
export const applyIncomingToPreview = (prev: ChatMessage[] | undefined, message: ChatMessage): ChatMessage[] =>
  mergeMessages(prev ?? [], [message]);
