import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
const secure = vi.hoisted(() => ({
  getItemAsync: vi.fn(async (): Promise<string | null> => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));
vi.mock('expo-secure-store', () => secure);

import { login, logout, register, restoreSession } from './auth';
import { useSession } from '../store/session';
import { useChatSeen } from '../store/chatSeen';
import { registerPush } from './push';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });
const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.y`;
const tokens = { accessToken: jwt({ id: 'u1', role: 'CANDIDATE' }), refreshToken: 'r1' };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  secure.getItemAsync.mockClear();
  secure.setItemAsync.mockClear();
  secure.deleteItemAsync.mockClear();
  await useSession.getState().clear();
});

describe('login', () => {
  it('faz POST /auth/login sem Authorization e grava os tokens', async () => {
    fetchMock.mockResolvedValueOnce(json(200, tokens));
    await login('a@b.com', 'senha1234');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com', password: 'senha1234' });
    expect(init.headers.Authorization).toBeUndefined();
    expect(useSession.getState()).toMatchObject({ accessToken: tokens.accessToken, refreshToken: 'r1', userId: 'u1', role: 'CANDIDATE' });
    expect(secure.setItemAsync).toHaveBeenCalledWith('finder.refreshToken', 'r1');
  });

  it('credenciais inválidas lançam ApiError e não gravam sessão', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }));
    await expect(login('a@b.com', 'errada123')).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(useSession.getState().accessToken).toBeNull();
  });
});

describe('register', () => {
  it('registra sempre como CANDIDATE e já deixa a sessão aberta', async () => {
    fetchMock.mockResolvedValueOnce(json(201, tokens));
    await register('novo@b.com', 'senha1234');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(init.body)).toEqual({ email: 'novo@b.com', password: 'senha1234', role: 'CANDIDATE' });
    expect(useSession.getState().accessToken).toBe(tokens.accessToken);
  });

  it('email já em uso (409) propaga o erro', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: 'Email taken', code: 'CONFLICT' }));
    await expect(register('a@b.com', 'senha1234')).rejects.toMatchObject({ status: 409 });
    expect(useSession.getState().accessToken).toBeNull();
  });
});

describe('logout', () => {
  beforeEach(async () => {
    await useSession.getState().setTokens(tokens);
  });

  it('avisa o servidor com o refresh token e limpa a sessão', async () => {
    fetchMock.mockResolvedValueOnce(json(204));
    await logout();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/logout');
    expect(JSON.parse(init.body)).toEqual({ refreshToken: 'r1' });
    expect(useSession.getState().accessToken).toBeNull();
    expect(secure.deleteItemAsync).toHaveBeenCalled();
  });

  it('apaga o "visto" das conversas para a próxima conta não herdar as não lidas', async () => {
    await useChatSeen.getState().markSeen('c1', '2026-01-02T00:00:00Z');
    fetchMock.mockResolvedValueOnce(json(204));
    await logout();
    expect(useChatSeen.getState().seen).toEqual({});
  });

  it('com push registrado, desregistra o aparelho ANTES de perder a sessão', async () => {
    fetchMock.mockImplementation(async () => json(204));
    await registerPush({
      isPhysicalDevice: true,
      projectId: 'p',
      getPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getToken: async () => 'ExponentPushToken[x]',
    });
    fetchMock.mockClear();
    await logout();

    const calls = fetchMock.mock.calls.map(([url, init]) => [init.method, String(url)]);
    expect(calls[0]).toEqual(['DELETE', expect.stringContaining('/push-tokens')]);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toMatch(/^Bearer /);
    expect(calls[1][1]).toContain('/auth/logout');
  });

  it('limpa localmente mesmo se o servidor estiver fora do ar', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    await expect(logout()).resolves.toBeUndefined();
    expect(useSession.getState().accessToken).toBeNull();
    expect(useSession.getState().refreshToken).toBeNull();
  });
});

describe('restoreSession', () => {
  it('sem refresh token salvo devolve "signedOut" e não chama a API', async () => {
    secure.getItemAsync.mockResolvedValueOnce(null);
    expect(await restoreSession()).toBe('signedOut');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com refresh token salvo renova e devolve "signedIn"', async () => {
    secure.getItemAsync.mockResolvedValueOnce('r-salvo');
    fetchMock.mockResolvedValueOnce(json(200, tokens));
    expect(await restoreSession()).toBe('signedIn');
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/refresh');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: 'r-salvo' });
    expect(useSession.getState().accessToken).toBe(tokens.accessToken);
  });

  it('refresh token expirado/recusado devolve "signedOut" e apaga o salvo', async () => {
    secure.getItemAsync.mockResolvedValueOnce('r-velho');
    fetchMock.mockResolvedValueOnce(json(401, { error: 'x' }));
    expect(await restoreSession()).toBe('signedOut');
    expect(useSession.getState().refreshToken).toBeNull();
    expect(secure.deleteItemAsync).toHaveBeenCalled();
  });

  it('servidor fora do ar devolve "offline" e MANTÉM o refresh token salvo', async () => {
    secure.getItemAsync.mockResolvedValueOnce('r-salvo');
    secure.deleteItemAsync.mockClear(); // o clear() do beforeEach também chama
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await restoreSession()).toBe('offline');
    expect(useSession.getState().refreshToken).toBe('r-salvo');
    expect(useSession.getState().accessToken).toBeNull();
    expect(secure.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('depois de offline, tentar de novo com o servidor no ar abre a sessão', async () => {
    // o SecureStore real persiste o valor entre as duas chamadas
    secure.getItemAsync.mockResolvedValueOnce('r-salvo').mockResolvedValueOnce('r-salvo');
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await restoreSession()).toBe('offline');

    fetchMock.mockResolvedValueOnce(json(200, tokens));
    expect(await restoreSession()).toBe('signedIn');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: 'r-salvo' });
  });

  it('erro 5xx no refresh não derruba a sessão: devolve "offline"', async () => {
    secure.getItemAsync.mockResolvedValueOnce('r-salvo');
    fetchMock.mockResolvedValueOnce(json(503, { error: 'x' }));
    expect(await restoreSession()).toBe('offline');
    expect(useSession.getState().refreshToken).toBe('r-salvo');
  });
});
