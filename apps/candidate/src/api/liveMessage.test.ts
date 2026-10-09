import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { handleLiveMessage } from './liveMessage';
import { useNotice } from '../store/notice';
import { useChatSeen } from '../store/chatSeen';
import type { ChatListItem, ChatMessage } from './chat';

vi.mock('expo-secure-store', () => ({ getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn() }));

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

const msg = (id: string, senderId = 'rec', createdAt = '2026-01-02T10:00:00Z'): ChatMessage => ({
  id,
  chatId: 'c1',
  senderId,
  content: `texto ${id}`,
  createdAt,
  readAt: null,
});

function setup() {
  const qc = new QueryClient();
  qc.setQueryData(['chats'], [chat]);
  useNotice.getState().reset();
  useChatSeen.setState({ seen: {}, hydrated: true });
  const notified = new Set<string>();
  const run = (m: ChatMessage) => handleLiveMessage({ qc, userId: 'cand', message: m, notified });
  return { qc, run };
}

describe('handleLiveMessage', () => {
  it('grava a mensagem na prévia do chat (badge e lista atualizam sem trocar de tela)', () => {
    const { qc, run } = setup();
    run(msg('m1'));
    expect(qc.getQueryData<ChatMessage[]>(['chat-preview', 'c1'])?.map((m) => m.id)).toEqual(['m1']);
  });

  it('também atualiza o histórico da conversa se ele já está em cache', () => {
    const { qc, run } = setup();
    qc.setQueryData(['messages', 'c1'], { pages: [{ data: [msg('m0', 'rec', '2026-01-01T10:00:00Z')], nextCursor: null }], pageParams: [undefined] });
    run(msg('m1'));
    const data = qc.getQueryData<{ pages: { data: ChatMessage[] }[] }>(['messages', 'c1']);
    expect(data?.pages[0].data.map((m) => m.id)).toEqual(['m1', 'm0']);
  });

  it('mostra o aviso in-app com empresa e prévia', () => {
    const { run } = setup();
    run(msg('m1'));
    expect(useNotice.getState().current).toEqual({ id: 'm1', chatId: 'c1', title: 'Nubloom', body: 'texto m1' });
  });

  it('não avisa de novo a mesma mensagem', () => {
    const { run } = setup();
    run(msg('m1'));
    useNotice.getState().dismiss('m1');
    run(msg('m1'));
    expect(useNotice.getState().current).toBeNull();
  });

  it('não avisa quando a conversa está aberta', () => {
    const { run } = setup();
    useNotice.getState().setOpenChat('c1');
    run(msg('m1'));
    expect(useNotice.getState().current).toBeNull();
  });

  it('não avisa a própria mensagem do candidato', () => {
    const { run } = setup();
    run(msg('m1', 'cand'));
    expect(useNotice.getState().current).toBeNull();
  });
});
