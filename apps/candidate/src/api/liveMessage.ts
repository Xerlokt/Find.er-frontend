import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useChatSeen } from '../store/chatSeen';
import { useNotice } from '../store/notice';
import { mergeMessages } from '../lib/chat';
import { applyIncomingToPreview } from '../lib/chatInbox';
import { noticeContent, shouldNotify } from '../lib/inAppNotice';
import type { ChatListItem, ChatMessage, MessagesPage } from './chat';

/** Mensagem ao vivo → prévia/histórico em cache (badge e lista reagem) + aviso in-app. */
export function handleLiveMessage(p: { qc: QueryClient; userId: string | null; message: ChatMessage; notified: Set<string> }) {
  const { qc, userId, message, notified } = p;
  qc.setQueryData<ChatMessage[]>(['chat-preview', message.chatId], (prev) => applyIncomingToPreview(prev, message));
  qc.setQueryData<InfiniteData<MessagesPage>>(['messages', message.chatId], (prev) => {
    if (!prev || prev.pages.length === 0) return prev;
    const [first, ...rest] = prev.pages;
    return { ...prev, pages: [{ ...first, data: mergeMessages(first.data, [message]) }, ...rest] };
  });

  const { openChatId } = useNotice.getState();
  const { seen } = useChatSeen.getState();
  if (!shouldNotify({ message, userId, openChatId, seen, notified })) return;
  notified.add(message.id);
  const chat = qc.getQueryData<ChatListItem[]>(['chats'])?.find((c) => c.id === message.chatId);
  useNotice.getState().show(noticeContent(chat, message, userId));
}
