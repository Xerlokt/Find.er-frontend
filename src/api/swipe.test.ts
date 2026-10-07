import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

import { getFeed, postSwipe } from './jobs';
import { useSession } from '../store/session';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await useSession.getState().setTokens({ accessToken: 'a.e30.b', refreshToken: 'r' });
});

describe('postSwipe', () => {
  it('faz POST /swipes com jobId e direction', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { id: 's1', jobId: 'j1', direction: 'DISLIKE', chatId: null }));
    await postSwipe('j1', 'DISLIKE');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/swipes$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ jobId: 'j1', direction: 'DISLIKE' });
  });

  it('LIKE devolve o chatId do chat aberto no match', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { id: 's1', jobId: 'j1', direction: 'LIKE', chatId: 'c1' }));
    expect((await postSwipe('j1', 'LIKE')).chatId).toBe('c1');
  });

  it('409 DUPLICATE_SWIPE chega como ApiError com o código', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: 'Already swiped', code: 'DUPLICATE_SWIPE' }));
    await expect(postSwipe('j1', 'LIKE')).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_SWIPE' });
  });

  it('429 chega com retryAfter', async () => {
    fetchMock.mockResolvedValueOnce(json(429, { statusCode: 429, error: 'Too Many Requests', retryAfter: 15 }));
    await expect(postSwipe('j1', 'LIKE')).rejects.toMatchObject({ status: 429, retryAfter: 15 });
  });
});

describe('getFeed', () => {
  it('pede 20 por página e só envia cursor quando existe', async () => {
    fetchMock.mockImplementation(async () => json(200, { data: [], nextCursor: null }));
    await getFeed();
    await getFeed('abc');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/jobs\/feed\?limit=20$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/jobs\/feed\?limit=20&cursor=abc$/);
  });
});
