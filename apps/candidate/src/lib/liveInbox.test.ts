import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveInbox } from './liveInbox';
import type { SocketLike } from './chatSocket';
import type { ChatMessage } from '../api/chat';

class FakeSocket implements SocketLike {
  static instances: FakeSocket[] = [];
  readyState = 0;
  closed = false;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(
    public url: string,
    public token: string,
  ) {
    FakeSocket.instances.push(this);
  }
  send() {}
  close() {
    this.closed = true;
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  drop(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
  receive(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

const message = (id: string, chatId: string): ChatMessage => ({
  id,
  chatId,
  senderId: 'rec',
  content: 'oi',
  createdAt: '2026-01-01T10:00:00Z',
  readAt: null,
});

function setup() {
  const got: { chatId: string; m: ChatMessage }[] = [];
  const opened: string[] = [];
  const inbox = new LiveInbox({
    url: (id) => `ws://host/chats/${id}/ws`,
    makeGetToken: () => async () => 'tok',
    createSocket: (url, token) => new FakeSocket(url, token),
    onMessage: (chatId, m) => got.push({ chatId, m }),
    onOpen: (chatId) => opened.push(chatId),
  });
  return { inbox, got, opened };
}

const flush = () => vi.advanceTimersByTimeAsync(0);
const byChat = (id: string) => FakeSocket.instances.find((s) => s.url.includes(`/chats/${id}/`))!;

beforeEach(() => {
  FakeSocket.instances = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('LiveInbox: um socket por chat', () => {
  it('abre um socket para cada chat da lista', async () => {
    const { inbox } = setup();
    inbox.sync(['a', 'b']);
    await flush();
    expect(FakeSocket.instances.map((s) => s.url)).toEqual(['ws://host/chats/a/ws', 'ws://host/chats/b/ws']);
  });

  it('sincronizar de novo não reabre os que já existem, só abre os novos', async () => {
    const { inbox } = setup();
    inbox.sync(['a']);
    await flush();
    inbox.sync(['a', 'b']);
    await flush();
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it('fecha o socket de chats que saíram da lista', async () => {
    const { inbox } = setup();
    inbox.sync(['a', 'b']);
    await flush();
    inbox.sync(['b']);
    expect(byChat('a').closed).toBe(true);
    expect(byChat('b').closed).toBe(false);
  });

  it('closeAll (logout) fecha tudo e permite reabrir depois', async () => {
    const { inbox } = setup();
    inbox.sync(['a', 'b']);
    await flush();
    inbox.closeAll();
    expect(FakeSocket.instances.every((s) => s.closed)).toBe(true);
    inbox.sync(['a']);
    await flush();
    expect(FakeSocket.instances).toHaveLength(3);
  });
});

describe('LiveInbox: eventos', () => {
  it('entrega a mensagem junto com o chat de origem', async () => {
    const { inbox, got } = setup();
    inbox.sync(['a', 'b']);
    await flush();
    byChat('b').open();
    byChat('b').receive(message('m1', 'b'));
    expect(got).toEqual([{ chatId: 'b', m: message('m1', 'b') }]);
  });

  it('1ª conexão não recarrega a prévia (já veio da lista); só as reconexões recarregam', async () => {
    const { inbox, opened } = setup();
    inbox.sync(['a']);
    await flush();
    byChat('a').open();
    expect(opened).toEqual([]);
    byChat('a').drop();
    await vi.advanceTimersByTimeAsync(1000);
    FakeSocket.instances[FakeSocket.instances.length - 1].open();
    expect(opened).toEqual(['a']);
  });
});
