import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../config';
import { useSession } from '../store/session';
import { useNotice } from '../store/notice';
import { chatWsUrl } from '../lib/chat';
import { LiveInbox } from '../lib/liveInbox';
import type { SocketLike } from '../lib/chatSocket';
import { refreshSession } from './client';
import { handleLiveMessage } from './liveMessage';
import { createChatSocket, useChats } from './chatHooks';

/** Logado: um WebSocket por chat para atualizar badge, lista e aviso na hora. Fecha tudo ao deslogar. */
export function useLiveInbox(signedIn: boolean) {
  const qc = useQueryClient();
  const chats = useChats(signedIn);
  const inboxRef = useRef<LiveInbox | null>(null);
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!signedIn) return;
    const inbox = new LiveInbox({
      url: (id) => chatWsUrl(API_URL, id),
      makeGetToken: () => {
        let first = true;
        return async () => {
          if (!first) await refreshSession(); // o access token (15 min) pode ter vencido numa reconexão
          first = false;
          return useSession.getState().accessToken;
        };
      },
      createSocket: createChatSocket as (url: string, token: string) => SocketLike,
      onMessage: (_chatId, message) =>
        handleLiveMessage({ qc, userId: useSession.getState().userId, message, notified: notifiedRef.current }),
      onOpen: (chatId) => qc.invalidateQueries({ queryKey: ['chat-preview', chatId] }),
    });
    inboxRef.current = inbox;
    return () => {
      inbox.closeAll();
      inboxRef.current = null;
      notifiedRef.current.clear();
      useNotice.getState().reset();
    };
  }, [signedIn, qc]);

  const ids = (chats.data ?? []).map((c) => c.id).join(',');
  useEffect(() => {
    inboxRef.current?.sync(ids ? ids.split(',') : []);
  }, [ids, signedIn]);
}
