import { describe, expect, it } from 'vitest';
import { badgeLabel, isUnread, markSeen, unreadCount, unreadMessageCount } from './unread';
import type { ChatListItem, ChatMessage } from '../api/chat';
import type { InboxItem } from './chatInbox';

const message = (id: string, chatId: string, senderId: string, createdAt: string) =>
  ({ id, chatId, senderId, content: 'oi', createdAt, readAt: null }) as ChatMessage;

const item = (chatId: string, senderId: string, createdAt: string): InboxItem => {
  const lastMessage = message(`m-${chatId}`, chatId, senderId, createdAt);
  return { chat: { id: chatId } as ChatListItem, lastMessage, messages: [lastMessage] };
};

const withMessages = (chatId: string, messages: ChatMessage[]): InboxItem => ({
  chat: { id: chatId } as ChatListItem,
  lastMessage: messages[0],
  messages,
});

describe('isUnread', () => {
  it('mensagem da empresa nunca vista é não lida', () => {
    expect(isUnread(item('a', 'rec', '2026-01-02T10:00:00Z'), 'cand', {})).toBe(true);
  });

  it('já vista (visto >= última mensagem) não é não lida', () => {
    expect(isUnread(item('a', 'rec', '2026-01-02T10:00:00Z'), 'cand', { a: '2026-01-02T10:00:00Z' })).toBe(false);
    expect(isUnread(item('a', 'rec', '2026-01-02T10:00:00Z'), 'cand', { a: '2026-01-03T00:00:00Z' })).toBe(false);
  });

  it('mensagem mais nova que a última vista volta a ser não lida', () => {
    expect(isUnread(item('a', 'rec', '2026-01-02T10:05:00Z'), 'cand', { a: '2026-01-02T10:00:00Z' })).toBe(true);
  });

  it('a última mensagem ser minha nunca conta como não lida', () => {
    expect(isUnread(item('a', 'cand', '2026-01-02T10:00:00Z'), 'cand', {})).toBe(false);
  });

  it('o "visto" de um chat não afeta outro', () => {
    expect(isUnread(item('b', 'rec', '2026-01-02T10:00:00Z'), 'cand', { a: '2026-01-05T00:00:00Z' })).toBe(true);
  });
});

describe('unreadCount', () => {
  it('conta só as conversas não lidas', () => {
    const items = [
      item('a', 'rec', '2026-01-02T10:00:00Z'),
      item('b', 'rec', '2026-01-02T11:00:00Z'),
      item('c', 'cand', '2026-01-02T12:00:00Z'),
    ];
    expect(unreadCount(items, 'cand', { a: '2026-01-02T10:00:00Z' })).toBe(1);
    expect(unreadCount(items, 'cand', {})).toBe(2);
    expect(unreadCount([], 'cand', {})).toBe(0);
  });
});

describe('markSeen', () => {
  it('registra o visto do chat sem alterar o mapa original', () => {
    const seen = { a: '2026-01-01T00:00:00Z' };
    const next = markSeen(seen, 'b', '2026-01-02T00:00:00Z');
    expect(next).toEqual({ a: '2026-01-01T00:00:00Z', b: '2026-01-02T00:00:00Z' });
    expect(seen).toEqual({ a: '2026-01-01T00:00:00Z' });
  });

  it('só avança: um visto mais antigo não regride o atual', () => {
    const seen = { a: '2026-01-05T00:00:00Z' };
    expect(markSeen(seen, 'a', '2026-01-02T00:00:00Z')).toBe(seen);
    expect(markSeen(seen, 'a', '2026-01-06T00:00:00Z').a).toBe('2026-01-06T00:00:00Z');
  });
});

describe('badgeLabel', () => {
  it('some com 0, mostra o número e limita a 9+', () => {
    expect(badgeLabel(0)).toBeUndefined();
    expect(badgeLabel(3)).toBe('3');
    expect(badgeLabel(9)).toBe('9');
    expect(badgeLabel(10)).toBe('9+');
  });
});

describe('unreadMessageCount: quantas mensagens da empresa ainda não foram vistas', () => {
  const msgs = [
    message('m4', 'a', 'rec', '2026-01-02T10:30:00Z'),
    message('m3', 'a', 'rec', '2026-01-02T10:20:00Z'),
    message('m2', 'a', 'cand', '2026-01-02T10:10:00Z'),
    message('m1', 'a', 'rec', '2026-01-02T10:00:00Z'),
  ];

  it('nunca visto: conta todas as mensagens da empresa (as minhas não contam)', () => {
    expect(unreadMessageCount(withMessages('a', msgs), 'cand', {})).toBe(3);
  });

  it('conta só as mais novas que a última vista', () => {
    expect(unreadMessageCount(withMessages('a', msgs), 'cand', { a: '2026-01-02T10:10:00Z' })).toBe(2);
  });

  it('tudo visto: zero', () => {
    expect(unreadMessageCount(withMessages('a', msgs), 'cand', { a: '2026-01-02T10:30:00Z' })).toBe(0);
  });

  it('o "visto" de outro chat não interfere', () => {
    expect(unreadMessageCount(withMessages('a', msgs), 'cand', { b: '2027-01-01T00:00:00Z' })).toBe(3);
  });
});
