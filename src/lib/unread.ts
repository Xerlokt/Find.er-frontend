import type { InboxItem } from './chatInbox';

/** chatId → createdAt da última mensagem que o candidato já viu. */
export type SeenMap = Record<string, string | undefined>;

const t = (iso: string) => Date.parse(iso);

/** Não lida: a última mensagem é da empresa e mais nova que a última vista. (O `readAt` do backend não serve: buscar mensagens já as marca como lidas.) */
export function isUnread(item: InboxItem, userId: string | null, seen: SeenMap): boolean {
  if (item.lastMessage.senderId === userId) return false;
  const last = seen[item.chat.id];
  return last === undefined || t(item.lastMessage.createdAt) > t(last);
}

/** Quantas mensagens da empresa chegaram depois da última vista (só conta o que está carregado na prévia do chat). */
export function unreadMessageCount(item: InboxItem, userId: string | null, seen: SeenMap): number {
  const last = seen[item.chat.id];
  return item.messages.filter((m) => m.senderId !== userId && (last === undefined || t(m.createdAt) > t(last))).length;
}

export const unreadCount = (items: InboxItem[], userId: string | null, seen: SeenMap) =>
  items.filter((i) => isUnread(i, userId, seen)).length;

/** Só avança; devolve o mesmo objeto se nada mudou (evita regravar). */
export function markSeen(seen: SeenMap, chatId: string, createdAt: string): SeenMap {
  const current = seen[chatId];
  if (current !== undefined && t(current) >= t(createdAt)) return seen;
  return { ...seen, [chatId]: createdAt };
}

export const badgeLabel = (n: number): string | undefined => (n <= 0 ? undefined : n > 9 ? '9+' : String(n));
