import { api } from './client';

/** Item de GET /chats. O backend não traz última mensagem, não lidas nem título da vaga. */
export type ChatListItem = {
  id: string;
  jobId: string;
  initiatedBy: 'MATCH' | 'CREDIT';
  isActive: boolean;
  createdAt: string;
  candidateName: string;
  candidateUserId: string;
  companyName: string;
  recruiterUserId: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

export type MessagesPage = { data: ChatMessage[]; nextCursor: string | null };

export const MESSAGES_PAGE_SIZE = 30;

export const listChats = () => api<ChatListItem[]>('/chats');

/** Mais novas primeiro. Buscar marca como lidas as mensagens do outro participante. */
export const getMessages = (chatId: string, cursor?: string) => {
  const qs = new URLSearchParams({ limit: String(MESSAGES_PAGE_SIZE) });
  if (cursor) qs.set('cursor', cursor);
  return api<MessagesPage>(`/chats/${chatId}/messages?${qs}`);
};
