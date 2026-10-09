import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));

import { getDisc, getMyProfile, saveMyProfile, submitDisc } from './candidates';
import { useSession } from '../store/session';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await useSession.getState().setTokens({ accessToken: 'a.e30.b', refreshToken: 'r' });
});

describe('candidates api', () => {
  it('getMyProfile devolve null quando o perfil não existe (404)', async () => {
    fetchMock.mockResolvedValueOnce(json(404, { error: 'Profile not found', code: 'NOT_FOUND' }));
    await expect(getMyProfile()).resolves.toBeNull();
  });

  it('getMyProfile propaga outros erros', async () => {
    fetchMock.mockResolvedValueOnce(json(500, { error: 'Internal server error' }));
    await expect(getMyProfile()).rejects.toMatchObject({ status: 500 });
  });

  it('saveMyProfile faz PUT /candidates/me com o corpo', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { id: 'p1' }));
    await saveMyProfile({
      name: 'Maria',
      professionId: 'frontend-dev',
      skills: ['react'],
      preferredModalities: ['REMOTE'],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/candidates\/me$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body).skills).toEqual(['react']);
  });

  it('DISC usa o id do perfil e envia as 4 respostas', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { dominant: 'D' }));
    const res = await submitDisc('p1', ['D', 'D', 'I', 'S']);
    expect(res.dominant).toBe('D');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/candidates\/p1\/disc$/);
    expect(JSON.parse(init.body)).toEqual({ answers: ['D', 'D', 'I', 'S'] });
  });

  it('getDisc devolve null se o teste ainda não foi feito', async () => {
    fetchMock.mockResolvedValueOnce(json(404, { error: 'Not found', code: 'NOT_FOUND' }));
    await expect(getDisc('p1')).resolves.toBeNull();
  });
});

