import { beforeEach, describe, expect, it, vi } from 'vitest';

const secure = vi.hoisted(() => ({
  getItemAsync: vi.fn(async (): Promise<string | null> => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));
vi.mock('expo-secure-store', () => secure);

import { useSession } from './session';
import { useOnboarding } from './onboarding';

const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.y`;

beforeEach(async () => {
  vi.clearAllMocks();
  await useSession.getState().clear();
  useSession.setState({ hydrated: false });
});

describe('session store', () => {
  it('setTokens guarda os tokens, extrai id/role do JWT e persiste só o refresh token', async () => {
    await useSession.getState().setTokens({ accessToken: jwt({ id: 'u9', role: 'RECRUITER' }), refreshToken: 'rt' });
    expect(useSession.getState()).toMatchObject({ userId: 'u9', role: 'RECRUITER', refreshToken: 'rt' });
    expect(secure.setItemAsync).toHaveBeenCalledTimes(1);
    expect(secure.setItemAsync).toHaveBeenCalledWith('finder.refreshToken', 'rt');
  });

  it('JWT malformado não derruba: id e role ficam nulos', async () => {
    await useSession.getState().setTokens({ accessToken: 'lixo', refreshToken: 'rt' });
    expect(useSession.getState()).toMatchObject({ accessToken: 'lixo', userId: null, role: null });
  });

  it('JWT com acentos no payload é decodificado (UTF-8)', async () => {
    const payload = JSON.stringify({ id: 'u1', role: 'CANDIDATE', name: 'João' });
    const bytes = String.fromCharCode(...new TextEncoder().encode(payload));
    await useSession.getState().setTokens({ accessToken: `x.${btoa(bytes)}.y`, refreshToken: 'rt' });
    expect(useSession.getState().userId).toBe('u1');
  });

  it('clear zera tudo e apaga o refresh token do SecureStore', async () => {
    await useSession.getState().setTokens({ accessToken: jwt({ id: 'u1', role: 'CANDIDATE' }), refreshToken: 'rt' });
    await useSession.getState().clear();
    expect(useSession.getState()).toMatchObject({ accessToken: null, refreshToken: null, userId: null, role: null });
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('finder.refreshToken');
  });

  it('clear não lança se o SecureStore falhar', async () => {
    secure.deleteItemAsync.mockRejectedValueOnce(new Error('boom'));
    await expect(useSession.getState().clear()).resolves.toBeUndefined();
  });

  it('hydrate carrega o refresh token salvo e marca hydrated', async () => {
    secure.getItemAsync.mockResolvedValueOnce('salvo');
    await useSession.getState().hydrate();
    expect(useSession.getState()).toMatchObject({ refreshToken: 'salvo', hydrated: true, accessToken: null });
  });

  it('hydrate com SecureStore quebrado ainda marca hydrated', async () => {
    secure.getItemAsync.mockRejectedValueOnce(new Error('boom'));
    await useSession.getState().hydrate();
    expect(useSession.getState().hydrated).toBe(true);
    expect(useSession.getState().refreshToken).toBeNull();
  });
});

describe('onboarding store', () => {
  it('pendingDisc começa falso e pode ser ligado/desligado', () => {
    expect(useOnboarding.getState().pendingDisc).toBe(false);
    useOnboarding.getState().setPendingDisc(true);
    expect(useOnboarding.getState().pendingDisc).toBe(true);
    useOnboarding.getState().setPendingDisc(false);
    expect(useOnboarding.getState().pendingDisc).toBe(false);
  });
});
