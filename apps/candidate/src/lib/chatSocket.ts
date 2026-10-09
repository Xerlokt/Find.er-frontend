import type { ChatMessage } from '../api/chat';
import { backoffMs, parseSocketPayload, validateOutgoing } from './chat';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

/** O mínimo do WebSocket que usamos — permite trocar por um falso nos testes. */
export interface SocketLike {
  readyState: number;
  send(data: string): void;
  close(code?: number): void;
  onopen: (() => void) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onclose: ((e: { code: number }) => void) | null;
  onerror: (() => void) | null;
}

type Options = {
  url: string;
  /** Chamado a cada tentativa: o access token expira em 15 min, então não dá para reaproveitar o antigo. */
  getToken: () => Promise<string | null>;
  createSocket: (url: string, token: string) => SocketLike;
  onMessage: (m: ChatMessage) => void;
  onError: (code: string) => void;
  onStatus: (s: SocketStatus) => void;
  /** A cada (re)conexão: quem usa deve recarregar o histórico para cobrir mensagens perdidas. */
  onOpen?: () => void;
};

const OPEN = 1;
const FORBIDDEN_CLOSE = 1008; // o backend fecha com 1008 quando o usuário não participa do chat

export class ChatSocket {
  private socket: SocketLike | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private status: SocketStatus | null = null;
  private attempt = 0;
  private generation = 0; // invalida eventos de sockets antigos
  private stopped = false;

  constructor(private readonly opts: Options) {}

  connect() {
    this.stopped = false;
    this.setStatus('connecting');
    void this.start();
  }

  send(text: string): boolean {
    const v = validateOutgoing(text);
    if (!v.ok || !this.socket || this.socket.readyState !== OPEN) return false;
    this.socket.send(JSON.stringify({ content: v.content }));
    return true;
  }

  close() {
    this.stopped = true;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.socket?.close(1000);
    this.socket = null;
    this.setStatus('closed');
  }

  private setStatus(s: SocketStatus) {
    if (this.status === s) return;
    this.status = s;
    this.opts.onStatus(s);
  }

  private async start() {
    const gen = ++this.generation;
    const token = await this.opts.getToken();
    if (gen !== this.generation || this.stopped) return;
    if (!token) {
      this.stopped = true;
      this.opts.onError('UNAUTHENTICATED');
      this.setStatus('closed');
      return;
    }

    const socket = this.opts.createSocket(this.opts.url, token);
    this.socket = socket;
    socket.onopen = () => {
      if (gen !== this.generation) return;
      this.attempt = 0;
      this.setStatus('open');
      this.opts.onOpen?.();
    };
    socket.onmessage = (e) => {
      if (gen !== this.generation) return;
      const p = parseSocketPayload(String(e.data));
      if (p.type === 'message') this.opts.onMessage(p.message);
      else if (p.type === 'error') this.opts.onError(p.code);
    };
    socket.onerror = () => {}; // o onclose sempre vem em seguida e cuida da reconexão
    socket.onclose = (e) => {
      if (gen !== this.generation || this.stopped) return;
      if (e.code === FORBIDDEN_CLOSE) {
        this.stopped = true;
        this.opts.onError('FORBIDDEN');
        this.setStatus('closed');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    this.setStatus('reconnecting');
    const delay = backoffMs(this.attempt++);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.start();
    }, delay);
  }
}
