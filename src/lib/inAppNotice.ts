import type { ChatListItem, ChatMessage } from '../api/chat';
import { otherParticipantName } from './chat';
import { previewText } from './chatInbox';
import type { SeenMap } from './unread';

export type Notice = { id: string; chatId: string; title: string; body: string };

/** Avisa só mensagem da empresa, de conversa que não está aberta, ainda não vista nem avisada (reconexão reenvia). */
export function shouldNotify(p: {
  message: ChatMessage;
  userId: string | null;
  openChatId: string | null;
  seen: SeenMap;
  notified: ReadonlySet<string>;
}): boolean {
  const { message, userId, openChatId, seen, notified } = p;
  if (message.senderId === userId) return false;
  if (openChatId === message.chatId) return false;
  if (notified.has(message.id)) return false;
  const last = seen[message.chatId];
  return last === undefined || Date.parse(message.createdAt) > Date.parse(last);
}

export const noticeContent = (chat: ChatListItem | undefined, message: ChatMessage, userId: string | null): Notice => ({
  id: message.id,
  chatId: message.chatId,
  title: chat ? otherParticipantName(chat, userId) : 'nova mensagem',
  body: previewText(message, userId),
});
