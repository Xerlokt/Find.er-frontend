import { beforeEach, describe, expect, it } from 'vitest';
import { useNotice } from './notice';

const n = (id: string) => ({ id, chatId: 'c1', title: 'Nubloom', body: id });

beforeEach(() => useNotice.getState().reset());

describe('notice store', () => {
  it('começa sem aviso nem conversa aberta', () => {
    expect(useNotice.getState().current).toBeNull();
    expect(useNotice.getState().openChatId).toBeNull();
  });

  it('show guarda o aviso e um novo substitui o anterior', () => {
    useNotice.getState().show(n('a'));
    useNotice.getState().show(n('b'));
    expect(useNotice.getState().current?.id).toBe('b');
  });

  it('dismiss limpa só se for o aviso informado (timer antigo não apaga o novo)', () => {
    useNotice.getState().show(n('a'));
    useNotice.getState().show(n('b'));
    useNotice.getState().dismiss('a');
    expect(useNotice.getState().current?.id).toBe('b');
    useNotice.getState().dismiss('b');
    expect(useNotice.getState().current).toBeNull();
  });

  it('setOpenChat registra a conversa aberta e só limpa a própria', () => {
    useNotice.getState().setOpenChat('c1');
    useNotice.getState().clearOpenChat('c2');
    expect(useNotice.getState().openChatId).toBe('c1');
    useNotice.getState().clearOpenChat('c1');
    expect(useNotice.getState().openChatId).toBeNull();
  });
});
