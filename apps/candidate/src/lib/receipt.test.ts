import { describe, expect, it } from 'vitest';
import { hasPendingReceipts, receiptStatus } from './receipt';
import type { ChatMessage } from '../api/chat';

const msg = (id: string, senderId: string, readAt: string | null = null): ChatMessage => ({
  id,
  chatId: 'c1',
  senderId,
  content: id,
  createdAt: '2026-01-01T10:00:00Z',
  readAt,
});

describe('receiptStatus', () => {
  it('mensagem minha sem readAt: enviada', () => {
    expect(receiptStatus(msg('a', 'cand'), 'cand')).toBe('sent');
  });

  it('mensagem minha com readAt: visualizada', () => {
    expect(receiptStatus(msg('a', 'cand', '2026-01-01T10:05:00Z'), 'cand')).toBe('read');
  });

  it('mensagem da empresa não tem confirmação', () => {
    expect(receiptStatus(msg('a', 'rec', '2026-01-01T10:05:00Z'), 'cand')).toBeNull();
  });
});

describe('hasPendingReceipts: vale a pena reconsultar o histórico?', () => {
  it('sim, se alguma mensagem minha ainda não foi visualizada', () => {
    expect(hasPendingReceipts([msg('a', 'rec'), msg('b', 'cand')], 'cand')).toBe(true);
  });

  it('não, se todas as minhas já foram visualizadas', () => {
    expect(hasPendingReceipts([msg('b', 'cand', '2026-01-01T10:05:00Z')], 'cand')).toBe(false);
  });

  it('não, se eu não enviei nada (mensagem não lida da empresa não conta)', () => {
    expect(hasPendingReceipts([msg('a', 'rec')], 'cand')).toBe(false);
  });
});
