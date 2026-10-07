import { describe, expect, it } from 'vitest';
import { applyIncomingToPreview, buildInbox, previewText } from './chatInbox';
import type { ChatListItem, ChatMessage } from '../api/chat';

const chat = (id: string, recruiterUserId = 'rec'): ChatListItem => ({
  id,
  jobId: `j-${id}`,
  initiatedBy: 'MATCH',
  isActive: true,
  createdAt: '2026-01-01T09:00:00Z',
  candidateName: 'Maria',
  candidateUserId: 'cand',
  companyName: `Empresa ${id}`,
  recruiterUserId,
});

const msg = (id: string, senderId: string, createdAt: string, content = id): ChatMessage => ({
  id,
  chatId: 'x',
  senderId,
  content,
  createdAt,
  readAt: null,
});

describe('buildInbox: só aparecem conversas que a empresa iniciou', () => {
  it('esconde chat sem mensagens (o like abre o chat, mas o candidato não vê até a empresa chamar)', () => {
    expect(buildInbox([chat('a')], { a: [] })).toEqual([]);
  });

  it('esconde chat em que só o candidato escreveu', () => {
    expect(buildInbox([chat('a')], { a: [msg('m1', 'cand', '2026-01-02T10:00:00Z')] })).toEqual([]);
  });

  it('esconde chat cujas mensagens ainda não carregaram', () => {
    expect(buildInbox([chat('a')], {})).toEqual([]);
  });

  it('mostra assim que o recrutador envia a 1ª mensagem', () => {
    const out = buildInbox([chat('a')], { a: [msg('m1', 'rec', '2026-01-02T10:00:00Z', 'Oi!')] });
    expect(out).toHaveLength(1);
    expect(out[0].chat.id).toBe('a');
    expect(out[0].lastMessage.content).toBe('Oi!');
  });
});

describe('buildInbox: ordem e última mensagem', () => {
  it('a última mensagem é a mais nova, independente da ordem recebida', () => {
    const messages = {
      a: [msg('m1', 'rec', '2026-01-02T10:00:00Z'), msg('m2', 'cand', '2026-01-02T10:05:00Z', 'resposta')],
    };
    expect(buildInbox([chat('a')], messages)[0].lastMessage.content).toBe('resposta');
  });

  it('conversas mais recentes primeiro', () => {
    const out = buildInbox([chat('a'), chat('b')], {
      a: [msg('m1', 'rec', '2026-01-02T10:00:00Z')],
      b: [msg('m2', 'rec', '2026-01-03T10:00:00Z')],
    });
    expect(out.map((i) => i.chat.id)).toEqual(['b', 'a']);
  });

  it('o recrutador de cada chat é considerado separadamente', () => {
    const out = buildInbox([chat('a', 'rec1'), chat('b', 'rec2')], {
      a: [msg('m1', 'rec2', '2026-01-02T10:00:00Z')], // mensagem de OUTRO recrutador não vale
      b: [msg('m2', 'rec2', '2026-01-02T11:00:00Z')],
    });
    expect(out.map((i) => i.chat.id)).toEqual(['b']);
  });
});

describe('previewText', () => {
  it('prefixa "você:" nas mensagens do próprio candidato', () => {
    expect(previewText(msg('m', 'cand', '2026-01-02T10:00:00Z', 'oi'), 'cand')).toBe('você: oi');
    expect(previewText(msg('m', 'rec', '2026-01-02T10:00:00Z', 'oi'), 'cand')).toBe('oi');
  });

  it('colapsa quebras de linha em espaço', () => {
    expect(previewText(msg('m', 'rec', '2026-01-02T10:00:00Z', 'a\n\nb'), 'cand')).toBe('a b');
  });
});

describe('buildInbox: guarda as mensagens para contar não lidas', () => {
  it('cada item traz as mensagens do chat', () => {
    const out = buildInbox([chat('a')], { a: [msg('m2', 'rec', '2026-01-02T10:05:00Z'), msg('m1', 'rec', '2026-01-02T10:00:00Z')] });
    expect(out[0].messages.map((m) => m.id)).toEqual(['m2', 'm1']);
  });
});

describe('applyIncomingToPreview: mensagem ao vivo entra na prévia sem recarregar', () => {
  it('cria a prévia quando ainda não existe', () => {
    expect(applyIncomingToPreview(undefined, msg('m1', 'rec', '2026-01-02T10:00:00Z')).map((m) => m.id)).toEqual(['m1']);
  });

  it('põe a nova na frente (mais nova primeiro) e não duplica por id', () => {
    const prev = [msg('m1', 'rec', '2026-01-02T10:00:00Z')];
    const out = applyIncomingToPreview(prev, msg('m2', 'rec', '2026-01-02T10:05:00Z'));
    expect(out.map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(applyIncomingToPreview(out, msg('m2', 'rec', '2026-01-02T10:05:00Z'))).toHaveLength(2);
  });

  it('a mensagem da empresa faz um chat oculto aparecer na caixa de entrada', () => {
    const preview = applyIncomingToPreview([], msg('m1', 'rec', '2026-01-02T10:00:00Z'));
    expect(buildInbox([chat('a')], { a: preview })).toHaveLength(1);
  });
});
