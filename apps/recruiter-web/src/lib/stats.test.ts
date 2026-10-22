import { describe, expect, it } from 'vitest';
import { barWidth, formatRate, hasSignal, highlights, sortJobs } from './stats';

const job = (id: string, views: number, likes: number, dislikes: number) => ({
  id,
  views,
  likes,
  dislikes,
  likeRate: likes + dislikes === 0 ? null : likes / (likes + dislikes),
});

describe('formatRate', () => {
  it('formata em porcentagem e usa traço sem reações', () => {
    expect(formatRate(0.625)).toBe('63%');
    expect(formatRate(null)).toBe('—');
  });
});

describe('sortJobs', () => {
  const jobs = [job('a', 10, 1, 4), job('b', 30, 6, 2), job('c', 20, 2, 0)];

  it('por likes', () => expect(sortJobs(jobs, 'likes').map((j) => j.id)).toEqual(['b', 'c', 'a']));
  it('por visualizações', () => expect(sortJobs(jobs, 'views').map((j) => j.id)).toEqual(['b', 'c', 'a']));
  it('por taxa de like, vaga sem reação por último', () => {
    const withEmpty = [...jobs, job('d', 99, 0, 0)];
    expect(sortJobs(withEmpty, 'rate').map((j) => j.id)).toEqual(['c', 'b', 'a', 'd']);
  });
  it('não muta a lista original', () => {
    sortJobs(jobs, 'likes');
    expect(jobs.map((j) => j.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('highlights', () => {
  it('acha melhor e pior vaga por taxa de like', () => {
    const r = highlights([job('a', 10, 1, 4), job('b', 30, 6, 2), job('c', 5, 0, 0)]);
    expect(r?.best.id).toBe('b');
    expect(r?.worst.id).toBe('a');
  });
  it('null com menos de 2 vagas com reações', () => {
    expect(highlights([job('a', 10, 1, 4), job('c', 5, 0, 0)])).toBeNull();
  });
  it('null quando todas empatam', () => {
    expect(highlights([job('a', 10, 1, 1), job('b', 4, 2, 2)])).toBeNull();
  });
});

describe('hasSignal / barWidth', () => {
  it('hasSignal exige ao menos uma reação', () => {
    expect(hasSignal(job('a', 9, 0, 0))).toBe(false);
    expect(hasSignal(job('a', 9, 0, 1))).toBe(true);
  });
  it('barWidth é proporcional ao máximo e seguro com zero', () => {
    expect(barWidth(5, 10)).toBe(50);
    expect(barWidth(0, 0)).toBe(0);
  });
});
