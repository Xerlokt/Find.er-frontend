import { describe, expect, it } from 'vitest';
import { noticeContent, shouldNotify } from './inAppNotice';
import type { ChatListItem, ChatMessage } from '../api/chat';

const chat: ChatListItem = {
  id: 'c1',
  jobId: 'j1',
  initiatedBy: 'MATCH',
  isActive: true,
  createdAt: '2026-01-01T09:00:00Z',
  candidateName: 'Maria',
  candidateUserId: 'cand',
  companyName: 'Nubloom',
  recruiterUserId: 'rec',
};

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  chatId: 'c1',
  senderId: 'rec',
  content: 'Oi!',
  createdAt: '2026-01-02T10:00:00Z',
  readAt: null,
  ...over,
});

const base = { userId: 'cand', openChatId: null, seen: {}, notified: new Set<string>() };

describe('shouldNotify', () => {
  it('avisa mensagem nova da empresa', () => {
    expect(shouldNotify({ ...base, message: msg() })).toBe(true);
  });

  it('não avisa a própria mensagem do candidato (eco do servidor)', () => {
    expect(shouldNotify({ ...base, message: msg({ senderId: 'cand' }) })).toBe(false);
  });

  it('não avisa se a conversa daquela mensagem está aberta', () => {
    expect(shouldNotify({ ...base, openChatId: 'c1', message: msg() })).toBe(false);
  });

  it('avisa se a conversa aberta é outra', () => {
    expect(shouldNotify({ ...base, openChatId: 'c2', message: msg() })).toBe(true);
  });

  it('não avisa mensagem já vista', () => {
    expect(shouldNotify({ ...base, seen: { c1: '2026-01-02T10:00:00Z' }, message: msg() })).toBe(false);
  });

  it('avisa mensagem mais nova que a última vista', () => {
    expect(shouldNotify({ ...base, seen: { c1: '2026-01-01T10:00:00Z' }, message: msg() })).toBe(true);
  });

  it('não avisa duas vezes a mesma mensagem (reconexão reenvia)', () => {
    expect(shouldNotify({ ...base, notified: new Set(['m1']), message: msg() })).toBe(false);
  });
});

describe('noticeContent', () => {
  it('título = empresa, corpo = prévia da mensagem, aponta para o chat', () => {
    expect(noticeContent(chat, msg({ content: 'Oi!\n  tudo bem?' }), 'cand')).toEqual({
      id: 'm1',
      chatId: 'c1',
      title: 'Nubloom',
      body: 'Oi! tudo bem?',
    });
  });

  it('sem o chat na lista ainda, usa um título neutro', () => {
    expect(noticeContent(undefined, msg(), 'cand').title).toBe('nova mensagem');
  });
});
