import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSocket, type SocketLike } from './chatSocket';
import type { ChatMessage } from '../api/chat';

class FakeSocket implements SocketLike {
  static instances: FakeSocket[] = [];
  readyState = 0; // CONNECTING
  sent: string[] = [];
  closed: { code?: number } | null = null;
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
  send(data: string) {
    this.sent.push(data);
  }
  close(code?: number) {
    this.closed = { code };
    this.readyState = 3;
  }
  // helpers dos testes
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(payload: unknown) {
    this.onmessage?.({ data: typeof payload === 'string' ? payload : JSON.stringify(payload) });
  }
  drop(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

const message = (id: string): ChatMessage => ({
  id,
  chatId: 'c1',
  senderId: 'rec',
  content: 'oi',
  createdAt: '2026-01-01T10:00:00Z',
  readAt: null,
});

function setup(getToken: () => Promise<string | null> = async () => 'tok') {
  const events = {
    messages: [] as ChatMessage[],
    errors: [] as string[],
    statuses: [] as string[],
    opens: 0,
  };
  const socket = new ChatSocket({
    url: 'ws://host/chats/c1/ws',
    getToken,
    createSocket: (url, token) => new FakeSocket(url, token),
    onMessage: (m) => events.messages.push(m),
    onError: (c) => events.errors.push(c),
    onStatus: (s) => events.statuses.push(s),
    onOpen: () => events.opens++,
  });
  return { socket, events };
}

const last = () => FakeSocket.instances[FakeSocket.instances.length - 1];
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  FakeSocket.instances = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('ChatSocket: conexão', () => {
  it('abre com a url e o token e passa por connecting → open', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    expect(last()).toMatchObject({ url: 'ws://host/chats/c1/ws', token: 'tok' });
    expect(events.statuses).toEqual(['connecting']);
    last().open();
    expect(events.statuses).toEqual(['connecting', 'open']);
    expect(events.opens).toBe(1);
  });

  it('sem token não abre socket e avisa', async () => {
    const { socket, events } = setup(async () => null);
    socket.connect();
    await flush();
    expect(FakeSocket.instances).toHaveLength(0);
    expect(events.errors).toEqual(['UNAUTHENTICATED']);
    expect(events.statuses.at(-1)).toBe('closed');
  });
});

describe('ChatSocket: recebimento', () => {
  it('entrega mensagens e erros do servidor, ignora lixo', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    last().open();
    last().receive(message('a'));
    last().receive({ error: 'RECRUITER_MUST_INITIATE' });
    last().receive('lixo');
    expect(events.messages.map((m) => m.id)).toEqual(['a']);
    expect(events.errors).toEqual(['RECRUITER_MUST_INITIATE']);
  });
});

describe('ChatSocket: envio', () => {
  it('envia {content} apenas com o socket aberto', async () => {
    const { socket } = setup();
    socket.connect();
    await flush();
    expect(socket.send('oi')).toBe(false); // ainda conectando
    last().open();
    expect(socket.send('  oi  ')).toBe(true);
    expect(last().sent).toEqual([JSON.stringify({ content: 'oi' })]);
  });

  it('não envia vazio nem acima de 5000 caracteres', async () => {
    const { socket } = setup();
    socket.connect();
    await flush();
    last().open();
    expect(socket.send('   ')).toBe(false);
    expect(socket.send('a'.repeat(5001))).toBe(false);
    expect(last().sent).toHaveLength(0);
  });
});

describe('ChatSocket: reconexão com backoff', () => {
  it('ao cair reconecta depois de 1s, depois 2s, 4s…', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    last().drop(); // 1ª queda sem nunca ter aberto
    expect(events.statuses.at(-1)).toBe('reconnecting');

    await vi.advanceTimersByTimeAsync(999);
    expect(FakeSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(2);

    last().drop();
    await vi.advanceTimersByTimeAsync(1999);
    expect(FakeSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(3);

    last().drop();
    await vi.advanceTimersByTimeAsync(3999);
    expect(FakeSocket.instances).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(4);
  });

  it('abrir com sucesso zera o backoff e dispara onOpen de novo (para recarregar o histórico)', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    last().drop();
    await vi.advanceTimersByTimeAsync(1000);
    last().drop();
    await vi.advanceTimersByTimeAsync(2000);
    last().open();
    expect(events.opens).toBe(1);
    expect(events.statuses.at(-1)).toBe('open');

    last().drop();
    await vi.advanceTimersByTimeAsync(1000); // voltou a 1s
    expect(FakeSocket.instances).toHaveLength(4);
  });

  it('busca um token novo a cada tentativa (o access token expira em 15 min)', async () => {
    const getToken = vi.fn().mockResolvedValueOnce('t1').mockResolvedValueOnce('t2');
    const { socket } = setup(getToken);
    socket.connect();
    await flush();
    last().drop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeSocket.instances.map((s) => s.token)).toEqual(['t1', 't2']);
  });

  it('o intervalo nunca passa de 30s', async () => {
    const { socket } = setup();
    socket.connect();
    await flush();
    for (let i = 0; i < 8; i++) {
      last().drop();
      await vi.advanceTimersByTimeAsync(30000);
    }
    const before = FakeSocket.instances.length;
    last().drop();
    await vi.advanceTimersByTimeAsync(29999);
    expect(FakeSocket.instances).toHaveLength(before);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(before + 1);
  });
});

describe('ChatSocket: encerramento', () => {
  it('close() fecha o socket, marca closed e não reconecta', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    last().open();
    const s = last();
    socket.close();
    expect(s.closed).not.toBeNull();
    s.drop(1000);
    await vi.advanceTimersByTimeAsync(60000);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(events.statuses.at(-1)).toBe('closed');
  });

  it('close() cancela uma reconexão agendada', async () => {
    const { socket } = setup();
    socket.connect();
    await flush();
    last().drop();
    socket.close();
    await vi.advanceTimersByTimeAsync(60000);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('close() enquanto o token ainda está sendo buscado não abre socket', async () => {
    let resolve!: (t: string) => void;
    const { socket } = setup(() => new Promise((r) => (resolve = r)));
    socket.connect();
    socket.close();
    resolve('tok');
    await flush();
    expect(FakeSocket.instances).toHaveLength(0);
  });

  it('código 1008 (Forbidden) não reconecta e avisa FORBIDDEN', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    last().drop(1008);
    await vi.advanceTimersByTimeAsync(60000);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(events.errors).toEqual(['FORBIDDEN']);
    expect(events.statuses.at(-1)).toBe('closed');
  });

  it('eventos de um socket antigo não afetam o atual', async () => {
    const { socket, events } = setup();
    socket.connect();
    await flush();
    const old = last();
    old.drop();
    await vi.advanceTimersByTimeAsync(1000);
    old.receive(message('fantasma'));
    old.drop();
    await vi.advanceTimersByTimeAsync(60000);
    expect(events.messages).toHaveLength(0);
    expect(FakeSocket.instances).toHaveLength(2); // a queda do antigo não agenda outra reconexão
  });
});
