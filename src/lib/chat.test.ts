import { describe, expect, it } from 'vitest';
import {
  CHAT_MAX_LENGTH,
  backoffMs,
  canCandidateSend,
  chatWsUrl,
  mergeMessages,
  otherParticipantName,
  parseSocketPayload,
  socketErrorMessage,
  validateOutgoing,
} from './chat';
import type { ChatListItem, ChatMessage } from '../api/chat';

const msg = (id: string, createdAt: string, senderId = 'u1'): ChatMessage => ({
  id,
  chatId: 'c1',
  senderId,
  content: `texto ${id}`,
  createdAt,
  readAt: null,
});

describe('chatWsUrl', () => {
  it('troca http por ws e https por wss', () => {
    expect(chatWsUrl('http://192.168.0.190:3000', 'c1')).toBe('ws://192.168.0.190:3000/chats/c1/ws');
    expect(chatWsUrl('https://api.finder.app', 'c1')).toBe('wss://api.finder.app/chats/c1/ws');
  });
});

describe('mergeMessages: confirmação de leitura não regride', () => {
  it('o eco ao vivo (readAt null) não apaga o readAt que o histórico já trouxe', () => {
    const history = [{ ...msg('a', '2026-01-01T10:00:00Z'), readAt: '2026-01-01T10:05:00Z' }];
    const live = [msg('a', '2026-01-01T10:00:00Z')];
    expect(mergeMessages(history, live)[0].readAt).toBe('2026-01-01T10:05:00Z');
  });

  it('o histórico novo (lida) vence a cópia ao vivo antiga (não lida)', () => {
    const live = [msg('a', '2026-01-01T10:00:00Z')];
    const history = [{ ...msg('a', '2026-01-01T10:00:00Z'), readAt: '2026-01-01T10:05:00Z' }];
    expect(mergeMessages(history, live)[0].readAt).toBe('2026-01-01T10:05:00Z');
  });
});

describe('mergeMessages', () => {
  it('junta histórico e mensagens ao vivo, sem duplicar por id (o servidor devolve a própria mensagem ao remetente)', () => {
    const history = [msg('b', '2026-01-01T10:01:00Z'), msg('a', '2026-01-01T10:00:00Z')];
    const live = [msg('b', '2026-01-01T10:01:00Z'), msg('c', '2026-01-01T10:02:00Z')];
    expect(mergeMessages(history, live).map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });

  it('ordena da mais nova para a mais antiga (lista invertida)', () => {
    const out = mergeMessages([msg('a', '2026-01-01T10:00:00Z')], [msg('z', '2026-01-02T10:00:00Z'), msg('m', '2026-01-01T12:00:00Z')]);
    expect(out.map((m) => m.id)).toEqual(['z', 'm', 'a']);
  });

  it('em caso de id repetido mantém a versão mais recente (ex.: readAt preenchido)', () => {
    const old = msg('a', '2026-01-01T10:00:00Z');
    const read = { ...old, readAt: '2026-01-01T10:05:00Z' };
    expect(mergeMessages([old], [read])[0].readAt).toBe('2026-01-01T10:05:00Z');
  });

  it('não altera os arrays recebidos e aceita vazios', () => {
    const a = [msg('a', '2026-01-01T10:00:00Z')];
    mergeMessages(a, []);
    expect(a).toHaveLength(1);
    expect(mergeMessages([], [])).toEqual([]);
  });
});

describe('canCandidateSend (regra RECRUITER_MUST_INITIATE)', () => {
  const messages = [msg('a', '2026-01-01T10:00:00Z', 'candidato')];

  it('bloqueado enquanto o recrutador não escreveu a 1ª mensagem', () => {
    expect(canCandidateSend([], 'recrutador')).toBe(false);
    expect(canCandidateSend(messages, 'recrutador')).toBe(false);
  });

  it('liberado depois que o recrutador enviou qualquer mensagem', () => {
    expect(canCandidateSend([...messages, msg('b', '2026-01-01T10:01:00Z', 'recrutador')], 'recrutador')).toBe(true);
  });
});

describe('validateOutgoing', () => {
  it('apara espaços e aceita de 1 a 5000 caracteres', () => {
    expect(validateOutgoing('  oi  ')).toEqual({ ok: true, content: 'oi' });
    expect(validateOutgoing('a'.repeat(CHAT_MAX_LENGTH))).toMatchObject({ ok: true });
  });

  it('rejeita vazio, só espaços e acima de 5000', () => {
    expect(validateOutgoing('')).toEqual({ ok: false });
    expect(validateOutgoing('   \n ')).toEqual({ ok: false });
    expect(validateOutgoing('a'.repeat(CHAT_MAX_LENGTH + 1))).toEqual({ ok: false });
  });
});

describe('parseSocketPayload', () => {
  it('reconhece uma mensagem', () => {
    const m = msg('a', '2026-01-01T10:00:00Z');
    expect(parseSocketPayload(JSON.stringify(m))).toEqual({ type: 'message', message: m });
  });

  it('reconhece {error: CODE}', () => {
    expect(parseSocketPayload('{"error":"RECRUITER_MUST_INITIATE"}')).toEqual({
      type: 'error',
      code: 'RECRUITER_MUST_INITIATE',
    });
  });

  it('ignora lixo, JSON inválido e objetos sem forma de mensagem', () => {
    expect(parseSocketPayload('não é json')).toEqual({ type: 'ignore' });
    expect(parseSocketPayload('{"foo":1}')).toEqual({ type: 'ignore' });
    expect(parseSocketPayload('null')).toEqual({ type: 'ignore' });
    expect(parseSocketPayload('{"id":"a"}')).toEqual({ type: 'ignore' });
  });
});

describe('socketErrorMessage', () => {
  it('traduz os códigos do backend', () => {
    expect(socketErrorMessage('RECRUITER_MUST_INITIATE')).toMatch(/recrutador/);
    expect(socketErrorMessage('INVALID_PAYLOAD')).toMatch(/mensagem/);
    expect(socketErrorMessage('NOT_PARTICIPANT')).toMatch(/permissão|participa/);
    expect(socketErrorMessage('FORBIDDEN')).toMatch(/permissão|participa/);
  });

  it('código desconhecido tem mensagem genérica', () => {
    expect(socketErrorMessage('SEND_ERROR')).toMatch(/não foi possível enviar|tenta de novo/);
    expect(socketErrorMessage('XYZ')).toMatch(/tenta de novo/);
  });
});

describe('backoffMs', () => {
  it('dobra a cada tentativa começando em 1s', () => {
    expect([0, 1, 2, 3].map(backoffMs)).toEqual([1000, 2000, 4000, 8000]);
  });

  it('é limitado a 30s', () => {
    expect(backoffMs(10)).toBe(30000);
    expect(backoffMs(100)).toBe(30000);
  });
});

describe('otherParticipantName', () => {
  const chat = {
    candidateUserId: 'cand',
    recruiterUserId: 'rec',
    candidateName: 'Maria',
    companyName: 'Acme',
  } as ChatListItem;

  it('candidato vê o nome da empresa; recrutador vê o do candidato', () => {
    expect(otherParticipantName(chat, 'cand')).toBe('Acme');
    expect(otherParticipantName(chat, 'rec')).toBe('Maria');
  });
});
