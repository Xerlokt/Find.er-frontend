import { beforeEach, describe, expect, it } from 'vitest';
import { useFeedFilter } from './feedFilter';
import { DEFAULT_FEED_FILTER } from '../lib/feedFilter';

beforeEach(() => useFeedFilter.getState().reset());

describe('feedFilter store', () => {
  it('começa com o filtro padrão (nada filtrado)', () => {
    expect(useFeedFilter.getState().filter).toEqual(DEFAULT_FEED_FILTER);
  });

  it('set substitui o filtro e reset volta ao padrão', () => {
    useFeedFilter.getState().set({ radiusKm: 50, skills: ['react'] });
    expect(useFeedFilter.getState().filter).toEqual({ radiusKm: 50, skills: ['react'] });
    useFeedFilter.getState().reset();
    expect(useFeedFilter.getState().filter).toEqual(DEFAULT_FEED_FILTER);
  });

  it('reset não compartilha o array do padrão (mutação acidental não vaza)', () => {
    useFeedFilter.getState().reset();
    expect(useFeedFilter.getState().filter.skills).not.toBe(DEFAULT_FEED_FILTER.skills);
  });
});
