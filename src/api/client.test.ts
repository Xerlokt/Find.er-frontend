import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

import { api } from './client';
import { ApiError } from './errors';
import { useSession } from '../store/session';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

// JWT fake só com o payload que o app lê
const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.y`;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await useSession.getState().setTokens({ accessToken: jwt({ id: 'u1', role: 'CANDIDATE' }), refreshToken: 'r1' });
});

describe('api client', () => {
  it('envia Authorization Bearer e decodifica role do JWT', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await api('/candidates/me');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toMatch(/^Bearer x\./);
    expect(useSession.getState().role).toBe('CANDIDATE');
  });

  it('em 401 renova o token e repete a request uma vez', async () => {
    const newAccess = jwt({ id: 'u1', role: 'CANDIDATE', n: 2 });
    fetchMock
      .mockResolvedValueOnce(json(401, { error: 'Unauthorized', code: 'UNAUTHORIZED' }))
      .mockResolvedValueOnce(json(200, { accessToken: newAccess, refreshToken: 'r2' }))
      .mockResolvedValueOnce(json(200, { id: 'p1' }));

    const res = await api<{ id: string }>('/candidates/me');

    expect(res.id).toBe('p1');
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${newAccess}`);
    expect(useSession.getState().refreshToken).toBe('r2');
  });

  it('requests concorrentes com 401 disparam um único refresh', async () => {
    const newAccess = jwt({ id: 'u1', role: 'CANDIDATE', n: 3 });
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        return json(200, { accessToken: newAccess, refreshToken: 'r2' });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === `Bearer ${newAccess}` ? json(200, { ok: true }) : json(401, { error: 'Unauthorized' });
    });

    await Promise.all([api('/a'), api('/b'), api('/c')]);
    expect(refreshCalls).toBe(1);
  });

  it('se o refresh falha, limpa a sessão e propaga o 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: 'Unauthorized', code: 'UNAUTHORIZED' }))
      .mockResolvedValueOnce(json(401, { error: 'Token expired', code: 'TOKEN_EXPIRED' }));

    await expect(api('/candidates/me')).rejects.toMatchObject({ status: 401 });
    expect(useSession.getState().accessToken).toBeNull();
    expect(useSession.getState().refreshToken).toBeNull();
  });

  it('rotas públicas não tentam refresh', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }));
    await expect(api('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('normaliza erros de validação (Zod) e de rede', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, { error: 'Validation error', details: [{ field: 'skills', message: 'obrigatório' }] }),
    );
    const err = (await api('/candidates/me', { method: 'PUT', body: {} }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.details?.[0].field).toBe('skills');

    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(api('/jobs/feed')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('servidor que não responde estoura o timeout em vez de ficar pendurado', async () => {
    vi.useFakeTimers();
    try {
      // fetch que só termina se for abortado, como um host inalcançável
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted')))),
      );
      const pending = api('/auth/login', { method: 'POST', body: {}, auth: false }).catch((e) => e);
      await vi.advanceTimersByTimeAsync(12_001);
      await expect(pending).resolves.toMatchObject({ status: 0, code: 'TIMEOUT' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('204 retorna undefined', async () => {
    fetchMock.mockResolvedValueOnce(json(204));
    await expect(api('/auth/logout', { method: 'POST', body: {}, auth: false })).resolves.toBeUndefined();
  });
});


