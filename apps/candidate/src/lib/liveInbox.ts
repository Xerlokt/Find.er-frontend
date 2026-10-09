import type { ChatMessage } from '../api/chat';
import { ChatSocket, type SocketLike } from './chatSocket';

type Options = {
  url: (chatId: string) => string;
  /** Uma função de token por chat (cada socket sabe se é a 1ª tentativa ou uma reconexão). */
  makeGetToken: () => () => Promise<string | null>;
  createSocket: (url: string, token: string) => SocketLike;
  onMessage: (chatId: string, m: ChatMessage) => void;
  /** A cada RE-conexão de um chat: recarregar a prévia para cobrir o que chegou enquanto estava offline. */
  onOpen?: (chatId: string) => void;
};

/**
 * O backend só tem WebSocket por conversa: mantemos um por chat enquanto o usuário está logado,
 * para o badge, a lista e o aviso in-app atualizarem na hora (sem esperar o polling).
 */
export class LiveInbox {
  private sockets = new Map<string, ChatSocket>();

  constructor(private readonly opts: Options) {}

  /** Abre os sockets dos chats novos e fecha os dos que saíram da lista. */
  sync(chatIds: string[]) {
    const wanted = new Set(chatIds);
    for (const [id, socket] of this.sockets) {
      if (!wanted.has(id)) {
        socket.close();
        this.sockets.delete(id);
      }
    }
    for (const id of wanted) {
      if (this.sockets.has(id)) continue;
      let opened = false;
      const socket = new ChatSocket({
        url: this.opts.url(id),
        getToken: this.opts.makeGetToken(),
        createSocket: this.opts.createSocket,
        onMessage: (m) => this.opts.onMessage(id, m),
        onError: () => {}, // erro de um chat não deve derrubar os outros; a conversa aberta mostra os dela
        onStatus: () => {},
        onOpen: () => {
          // a 1ª conexão não precisa recarregar nada (a prévia acabou de vir da lista); só as reconexões
          if (opened) this.opts.onOpen?.(id);
          opened = true;
        },
      });
      this.sockets.set(id, socket);
      socket.connect();
    }
  }

  closeAll() {
    for (const socket of this.sockets.values()) socket.close();
    this.sockets.clear();
  }
}
