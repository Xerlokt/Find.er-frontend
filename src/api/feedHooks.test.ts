import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { flattenFeed } from './feedHooks';
import type { FeedJob, FeedPage } from './jobs';

const job = (id: string) => ({ id, fitScore: 50 }) as FeedJob;
const page = (ids: string[], nextCursor: string | null): FeedPage => ({ data: ids.map(job), nextCursor });

describe('flattenFeed', () => {
  it('junta as páginas na ordem e remove ids repetidos', () => {
    const out = flattenFeed({ pages: [page(['a', 'b'], 'b'), page(['b', 'c'], null)], pageParams: [undefined, 'b'] });
    expect(out.map((j) => j.id)).toEqual(['a', 'b', 'c']);
  });

  it('aceita dados ausentes', () => {
    expect(flattenFeed(undefined)).toEqual([]);
  });
});

