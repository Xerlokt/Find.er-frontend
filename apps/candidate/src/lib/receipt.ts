import type { ChatMessage } from '../api/chat';

export type Receipt = 'sent' | 'read';

/** Confirmação de leitura só das minhas mensagens: `readAt` é preenchido quando a empresa busca o histórico. */
export const receiptStatus = (m: ChatMessage, userId: string | null): Receipt | null =>
  m.senderId !== userId ? null : m.readAt ? 'read' : 'sent';

/** Enquanto houver mensagem minha sem leitura, vale reconsultar o histórico (o backend não manda evento de leitura). */
export const hasPendingReceipts = (messages: ChatMessage[], userId: string | null): boolean =>
  messages.some((m) => receiptStatus(m, userId) === 'sent');
