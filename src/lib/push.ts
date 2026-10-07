/** O backend manda `data: { chatId }` em cada push de mensagem nova. */
export function chatIdFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const id = (data as { chatId?: unknown }).chatId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
