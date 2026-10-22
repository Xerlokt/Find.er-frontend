import { describe, expect, it } from 'vitest';
import { barRatio, formatLikeRate, insight, maxDay, weekdayLabel } from './metrics';
import type { CandidateMetrics } from '../api/candidates';

const base = (o: Partial<CandidateMetrics> = {}): CandidateMetrics => ({
  swipes: { total: 10, likes: 4, dislikes: 6, likeRate: 0.4 },
  chats: { total: 0, viaMatch: 0, viaCredit: 0 },
  companiesUnlockedYou: 0,
  last7Days: [],
  discDominant: null,
  ...o,
});

describe('formatLikeRate', () => {
  it('arredonda e usa traço sem swipes', () => {
    expect(formatLikeRate(0.625)).toBe('63%');
    expect(formatLikeRate(0)).toBe('0%');
    expect(formatLikeRate(null)).toBe('—');
  });
});

describe('weekdayLabel', () => {
  it('2026-10-22 é quinta', () => expect(weekdayLabel('2026-10-22')).toBe('qui'));
  it('2026-10-25 é domingo', () => expect(weekdayLabel('2026-10-25')).toBe('dom'));
});

describe('maxDay / barRatio', () => {
  it('maxDay soma likes+dislikes do maior dia e nunca é zero', () => {
    expect(maxDay([])).toBe(1);
    expect(maxDay([{ date: 'a', likes: 2, dislikes: 1 }, { date: 'b', likes: 5, dislikes: 0 }])).toBe(5);
  });
  it('barRatio é proporcional e limitado a 1', () => {
    expect(barRatio(2, 4)).toBe(0.5);
    expect(barRatio(9, 4)).toBe(1);
    expect(barRatio(1, 0)).toBe(0);
  });
});

describe('insight', () => {
  it('sem swipes convida para o feed', () => {
    expect(insight(base({ swipes: { total: 0, likes: 0, dislikes: 0, likeRate: null } }))).toMatch(/feed/);
  });
  it('empresa que pagou tem prioridade, com singular e plural', () => {
    expect(insight(base({ companiesUnlockedYou: 1 }))).toMatch(/1 empresa pagou/);
    expect(insight(base({ companiesUnlockedYou: 3 }))).toMatch(/3 empresas pagaram/);
  });
  it('taxa alta e baixa', () => {
    expect(insight(base({ swipes: { total: 10, likes: 8, dislikes: 2, likeRate: 0.8 } }))).toMatch(/maioria/);
    expect(insight(base({ swipes: { total: 10, likes: 1, dislikes: 9, likeRate: 0.1 } }))).toMatch(/seletivo/);
  });
  it('taxa média cai na frase neutra', () => {
    expect(insight(base())).toMatch(/continue/);
  });
});
