import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

import { registerPush, unregisterPush, type PushDevice } from './push';
import { useSession } from '../store/session';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const TOKEN = 'ExponentPushToken[abc]';

const makeDevice = (over: Partial<PushDevice> = {}): PushDevice => ({
  isPhysicalDevice: true,
  projectId: 'proj-1',
  getPermission: vi.fn(async () => 'granted' as const),
  requestPermission: vi.fn(async () => 'granted' as const),
  getToken: vi.fn(async () => TOKEN),
  ...over,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn().mockImplementation(async () => json(204));
  vi.stubGlobal('fetch', fetchMock);
  await useSession.getState().setTokens({ accessToken: 'a.e30.b', refreshToken: 'r' });
});

describe('registerPush', () => {
  it('com permissão: pega o token e faz PUT /push-tokens', async () => {
    const device = makeDevice();
    expect(await registerPush(device)).toBe(TOKEN);
    expect(device.getToken).toHaveBeenCalledWith('proj-1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/push-tokens$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN });
  });

  it('permissão indefinida: pede ao usuário; se negar, não registra nada', async () => {
    const device = makeDevice({
      getPermission: vi.fn(async () => 'undetermined' as const),
      requestPermission: vi.fn(async () => 'denied' as const),
    });
    expect(await registerPush(device)).toBeNull();
    expect(device.requestPermission).toHaveBeenCalled();
    expect(device.getToken).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('permissão já negada: não pergunta de novo', async () => {
    const device = makeDevice({ getPermission: vi.fn(async () => 'denied' as const) });
    expect(await registerPush(device)).toBeNull();
    expect(device.requestPermission).not.toHaveBeenCalled();
  });

  it('emulador ou sem projectId: ignora silenciosamente', async () => {
    expect(await registerPush(makeDevice({ isPhysicalDevice: false }))).toBeNull();
    expect(await registerPush(makeDevice({ projectId: undefined }))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('qualquer falha (Expo Go sem push, rede) vira null e nunca lança', async () => {
    expect(await registerPush(makeDevice({ getToken: vi.fn(async () => { throw new Error('sem push'); }) }))).toBeNull();
    fetchMock.mockImplementation(async () => { throw new TypeError('network'); });
    expect(await registerPush(makeDevice())).toBeNull();
  });
});

describe('unregisterPush', () => {
  it('faz DELETE /push-tokens com o token', async () => {
    await unregisterPush(TOKEN);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/push-tokens$/);
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN });
  });

  it('sem token ou com a API fora do ar não lança', async () => {
    await expect(unregisterPush(null)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockImplementation(async () => { throw new TypeError('network'); });
    await expect(unregisterPush(TOKEN)).resolves.toBeUndefined();
  });
});
