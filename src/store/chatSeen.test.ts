import { beforeEach, describe, expect, it, vi } from 'vitest';

const secure = vi.hoisted(() => ({
  getItemAsync: vi.fn(async (): Promise<string | null> => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));
vi.mock('expo-secure-store', () => secure);

import { useChatSeen } from './chatSeen';

beforeEach(async () => {
  vi.clearAllMocks();
  await useChatSeen.getState().clear();
  useChatSeen.setState({ hydrated: false });
  vi.clearAllMocks();
});

describe('chatSeen store', () => {
  it('hydrate lê o que foi salvo e marca hydrated', async () => {
    secure.getItemAsync.mockResolvedValueOnce(JSON.stringify({ a: '2026-01-01T00:00:00Z' }));
    await useChatSeen.getState().hydrate();
    expect(useChatSeen.getState()).toMatchObject({ hydrated: true, seen: { a: '2026-01-01T00:00:00Z' } });
  });

  it('hydrate com nada salvo, JSON inválido ou SecureStore quebrado ainda marca hydrated com mapa vazio', async () => {
    secure.getItemAsync.mockResolvedValueOnce(null);
    await useChatSeen.getState().hydrate();
    expect(useChatSeen.getState()).toMatchObject({ hydrated: true, seen: {} });

    useChatSeen.setState({ hydrated: false });
    secure.getItemAsync.mockResolvedValueOnce('{lixo');
    await useChatSeen.getState().hydrate();
    expect(useChatSeen.getState()).toMatchObject({ hydrated: true, seen: {} });

    useChatSeen.setState({ hydrated: false });
    secure.getItemAsync.mockRejectedValueOnce(new Error('boom'));
    await useChatSeen.getState().hydrate();
    expect(useChatSeen.getState()).toMatchObject({ hydrated: true, seen: {} });
  });

  it('markSeen atualiza o estado e persiste', async () => {
    await useChatSeen.getState().markSeen('a', '2026-01-02T00:00:00Z');
    expect(useChatSeen.getState().seen).toEqual({ a: '2026-01-02T00:00:00Z' });
    expect(secure.setItemAsync).toHaveBeenCalledWith('finder.chatSeen', JSON.stringify({ a: '2026-01-02T00:00:00Z' }));
  });

  it('markSeen com data mais antiga não regride nem grava de novo', async () => {
    await useChatSeen.getState().markSeen('a', '2026-01-05T00:00:00Z');
    secure.setItemAsync.mockClear();
    await useChatSeen.getState().markSeen('a', '2026-01-02T00:00:00Z');
    expect(useChatSeen.getState().seen.a).toBe('2026-01-05T00:00:00Z');
    expect(secure.setItemAsync).not.toHaveBeenCalled();
  });

  it('clear zera o mapa e apaga o salvo (troca de conta)', async () => {
    await useChatSeen.getState().markSeen('a', '2026-01-02T00:00:00Z');
    await useChatSeen.getState().clear();
    expect(useChatSeen.getState().seen).toEqual({});
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('finder.chatSeen');
  });
});
