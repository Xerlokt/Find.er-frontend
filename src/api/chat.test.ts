import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

import { getMessages, listChats } from './chat';
import { useSession } from '../store/session';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await useSession.getState().setTokens({ accessToken: 'a.e30.b', refreshToken: 'r' });
});

describe('listChats', () => {
  it('faz GET /chats e devolve a lista', async () => {
    const chats = [{ id: 'c1', jobId: 'j1', companyName: 'Acme' }];
    fetchMock.mockResolvedValueOnce(json(200, chats));
    expect(await listChats()).toEqual(chats);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/chats$/);
  });
});

describe('getMessages', () => {
  it('pede 30 por página e só envia cursor quando existe', async () => {
    fetchMock.mockImplementation(async () => json(200, { data: [], nextCursor: null }));
    await getMessages('c1');
    await getMessages('c1', 'm9');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/chats\/c1\/messages\?limit=30$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/chats\/c1\/messages\?limit=30&cursor=m9$/);
  });

  it('403 chega como ApiError', async () => {
    fetchMock.mockResolvedValueOnce(json(403, { error: 'Not a participant', code: 'FORBIDDEN' }));
    await expect(getMessages('c1')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
