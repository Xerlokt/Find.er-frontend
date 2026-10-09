import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatSeen } from '../store/chatSeen';
import { unreadCount } from '../lib/unread';
import { API_URL } from '../config';
import { useSession } from '../store/session';
import { ChatSocket, type SocketLike, type SocketStatus } from '../lib/chatSocket';
import { chatWsUrl, mergeMessages, socketErrorMessage } from '../lib/chat';
import { buildInbox } from '../lib/chatInbox';
import { hasPendingReceipts } from '../lib/receipt';
import { refreshSession } from './client';
import { getMessages, listChats, type ChatMessage } from './chat';

export const chatsKey = ['chats'] as const;

/**
 * Rede de segurança: o tempo real vem dos WebSockets (`useLiveInbox`), então o polling é lento de propósito.
 * O backend limita 60 req/min por IP (global, inclui handshake de WebSocket) e a caixa de entrada faz 1 req por chat.
 */
export const INBOX_POLL_MS = 90_000;
/** Intervalo para descobrir que a empresa visualizou (1 req por tick só enquanto a conversa está aberta e há pendência). */
export const RECEIPT_POLL_MS = 8_000;
const messagesKey = (chatId: string) => ['messages', chatId] as const;

export const useChats = (enabled = true) => useQuery({ queryKey: chatsKey, queryFn: listChats, enabled });
const useInboxChats = () => useQuery({ queryKey: chatsKey, queryFn: listChats, refetchInterval: INBOX_POLL_MS });

/**
 * Caixa de entrada: o like abre o chat no backend, mas ele só aparece aqui depois que a empresa escreve.
 * O backend não manda última mensagem, então buscamos a 1ª página de cada chat (N+1 — ver pedidos ao backend no PLANO).
 */
export function useChatInbox() {
  const chats = useInboxChats();
  const list = chats.data ?? [];
  const previews = useQueries({
    queries: list.map((c) => ({
      queryKey: ['chat-preview', c.id],
      queryFn: async () => (await getMessages(c.id)).data,
      refetchInterval: INBOX_POLL_MS,
    })),
  });
  const byChat = Object.fromEntries(list.map((c, i) => [c.id, previews[i]?.data]));
  const items = buildInbox(list, byChat);

  const refetch = useCallback(async () => {
    const fresh = await chats.refetch();
    await Promise.all(previews.map((p) => p.refetch()));
    return fresh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.refetch, previews.length]);

  return {
    items,
    isPending: chats.isPending || (list.length > 0 && previews.some((p) => p.isPending)),
    isError: chats.isError,
    error: chats.error,
    isRefetching: chats.isRefetching || previews.some((p) => p.isRefetching),
    refetch,
  };
}

/** Número de conversas com mensagem nova da empresa (para o badge da aba). Zero até o "visto" carregar do aparelho. */
export function useUnreadChats() {
  const { items } = useChatInbox();
  const userId = useSession((s) => s.userId);
  const { seen, hydrated } = useChatSeen();
  return hydrated ? unreadCount(items, userId, seen) : 0;
}

/** React Native aceita headers no 3º argumento do WebSocket; o backend lê o JWT do header Authorization. */
export const createChatSocket = (url: string, token: string): SocketLike =>
  new (WebSocket as unknown as new (u: string, p: undefined, o: { headers: Record<string, string> }) => SocketLike)(
    url,
    undefined,
    { headers: { Authorization: `Bearer ${token}` } },
  );

/**
 * Conversa em tempo real: histórico paginado (REST) + mensagens ao vivo (WebSocket), sem duplicar por id.
 * A cada (re)conexão o histórico é recarregado para cobrir o que chegou enquanto estava offline.
 */
export function useConversation(chatId: string) {
  const qc = useQueryClient();
  const history = useInfiniteQuery({
    queryKey: messagesKey(chatId),
    queryFn: ({ pageParam }) => getMessages(chatId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    // sem evento de leitura no WebSocket: enquanto há mensagem minha "enviada", reconsulta para pegar o "visualizada"
    refetchInterval: (q) =>
      hasPendingReceipts(q.state.data?.pages.flatMap((p) => p.data) ?? [], useSession.getState().userId) ? RECEIPT_POLL_MS : false,
  });

  const [live, setLive] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  useEffect(() => {
    setLive([]);
    let first = true;
    const socket = new ChatSocket({
      url: chatWsUrl(API_URL, chatId),
      // depois da 1ª tentativa o access token (15 min) pode ter vencido: renova antes de reconectar
      getToken: async () => {
        if (!first) await refreshSession();
        first = false;
        return useSession.getState().accessToken;
      },
      createSocket: createChatSocket,
      onMessage: (m) => {
        setError(null);
        setLive((prev) => mergeMessages(prev, [m]));
      },
      onError: (code) => setError(socketErrorMessage(code)),
      onStatus: setStatus,
      onOpen: () => {
        qc.invalidateQueries({ queryKey: messagesKey(chatId) });
      },
    });
    socketRef.current = socket;
    socket.connect();
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [chatId, qc]);

  const messages = useMemo(
    () => mergeMessages(history.data?.pages.flatMap((p) => p.data) ?? [], live),
    [history.data, live],
  );

  const send = useCallback((text: string) => {
    setError(null);
    const ok = socketRef.current?.send(text) ?? false;
    if (!ok) setError('sem conexão ainda, tenta de novo em instantes');
    return ok;
  }, []);

  return { messages, history, status, error, send };
}
