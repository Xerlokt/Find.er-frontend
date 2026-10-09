import { describe, expect, it } from 'vitest';
import { DEFAULT_FEED_FILTER, activeFilterCount, applyFeedFilter, isFilterActive, toggleSkill } from './feedFilter';
import type { FeedJob } from '../api/jobs';

const SP = { lat: -23.5505, lng: -46.6333 };
const CAMPINAS = { lat: -22.9099, lng: -47.0626 }; // ~85 km de SP
const RIO = { lat: -22.9068, lng: -43.1729 }; // ~360 km de SP

const job = (id: string, skills: string[], coords?: { lat: number; lng: number }) =>
  ({ id, requiredSkills: skills, lat: coords?.lat ?? null, lng: coords?.lng ?? null }) as FeedJob;

const ids = (jobs: FeedJob[]) => jobs.map((j) => j.id);

describe('filtro padrão', () => {
  it('começa sem limite de distância e sem tags (nada é filtrado)', () => {
    expect(DEFAULT_FEED_FILTER).toEqual({ radiusKm: 200, skills: [] });
    expect(isFilterActive(DEFAULT_FEED_FILTER)).toBe(false);
    expect(activeFilterCount(DEFAULT_FEED_FILTER)).toBe(0);
  });

  it('conta distância e tags como filtros ativos', () => {
    expect(isFilterActive({ radiusKm: 50, skills: [] })).toBe(true);
    expect(isFilterActive({ radiusKm: 200, skills: ['react'] })).toBe(true);
    expect(activeFilterCount({ radiusKm: 50, skills: ['react', 'css'] })).toBe(2);
    expect(activeFilterCount({ radiusKm: 200, skills: ['react'] })).toBe(1);
  });
});

describe('toggleSkill', () => {
  it('liga e desliga uma tag sem alterar o filtro original', () => {
    const f = { radiusKm: 200, skills: ['react'] };
    expect(toggleSkill(f, 'css').skills).toEqual(['react', 'css']);
    expect(toggleSkill(f, 'react').skills).toEqual([]);
    expect(f.skills).toEqual(['react']);
  });
});

describe('applyFeedFilter: tags', () => {
  const jobs = [job('a', ['react', 'css']), job('b', ['nodejs']), job('c', ['python', 'react'])];

  it('sem tags selecionadas mantém todas', () => {
    expect(ids(applyFeedFilter(jobs, DEFAULT_FEED_FILTER, null))).toEqual(['a', 'b', 'c']);
  });

  it('com tags mantém vagas que exigem ao menos uma delas', () => {
    expect(ids(applyFeedFilter(jobs, { radiusKm: 200, skills: ['react'] }, null))).toEqual(['a', 'c']);
    expect(ids(applyFeedFilter(jobs, { radiusKm: 200, skills: ['nodejs', 'css'] }, null))).toEqual(['a', 'b']);
  });

  it('nenhuma vaga com a tag resulta em lista vazia', () => {
    expect(applyFeedFilter(jobs, { radiusKm: 200, skills: ['rust'] }, null)).toEqual([]);
  });
});

describe('applyFeedFilter: distância', () => {
  const jobs = [job('perto', ['x'], SP), job('campinas', ['x'], CAMPINAS), job('rio', ['x'], RIO), job('remota', ['x'])];

  it('raio máximo (200+) não filtra nada, nem vaga a 360 km', () => {
    expect(ids(applyFeedFilter(jobs, { radiusKm: 200, skills: [] }, SP))).toEqual(['perto', 'campinas', 'rio', 'remota']);
  });

  it('com raio menor, descarta vagas mais distantes que o raio', () => {
    expect(ids(applyFeedFilter(jobs, { radiusKm: 100, skills: [] }, SP))).toEqual(['perto', 'campinas', 'remota']);
    expect(ids(applyFeedFilter(jobs, { radiusKm: 20, skills: [] }, SP))).toEqual(['perto', 'remota']);
  });

  it('vaga sem localização (ex.: remota) nunca é descartada por distância', () => {
    expect(ids(applyFeedFilter([job('remota', ['x'])], { radiusKm: 5, skills: [] }, SP))).toEqual(['remota']);
  });

  it('sem a localização do candidato a distância não pode ser aplicada: mantém tudo', () => {
    expect(ids(applyFeedFilter(jobs, { radiusKm: 5, skills: [] }, null))).toEqual(['perto', 'campinas', 'rio', 'remota']);
  });
});

describe('applyFeedFilter: combinação', () => {
  it('aplica tags e distância juntas, preservando a ordem do feed', () => {
    const jobs = [job('1', ['react'], RIO), job('2', ['css'], SP), job('3', ['react'], SP), job('4', ['react'])];
    expect(ids(applyFeedFilter(jobs, { radiusKm: 50, skills: ['react'] }, SP))).toEqual(['3', '4']);
  });

  it('não altera o array recebido', () => {
    const jobs = [job('1', ['a']), job('2', ['b'])];
    applyFeedFilter(jobs, { radiusKm: 200, skills: ['a'] }, null);
    expect(jobs).toHaveLength(2);
  });
});
