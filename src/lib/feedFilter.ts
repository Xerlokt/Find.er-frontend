import type { FeedJob } from '../api/jobs';
import { distanceKm } from './format';
import { RADIUS_MAX_KM } from './radius';

/** Filtro local do feed (o backend não filtra). radiusKm no máximo ("200+") = sem limite; skills vazio = sem filtro de tags. */
export type FeedFilter = { radiusKm: number; skills: string[] };

export const DEFAULT_FEED_FILTER: FeedFilter = { radiusKm: RADIUS_MAX_KM, skills: [] };

const distanceActive = (f: FeedFilter) => f.radiusKm < RADIUS_MAX_KM;

export const isFilterActive = (f: FeedFilter) => distanceActive(f) || f.skills.length > 0;

export const activeFilterCount = (f: FeedFilter) => (distanceActive(f) ? 1 : 0) + (f.skills.length > 0 ? 1 : 0);

export const toggleSkill = (f: FeedFilter, skill: string): FeedFilter => ({
  ...f,
  skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
});

/**
 * Tags: a vaga precisa exigir ao menos uma das selecionadas.
 * Distância: só vale com a localização do candidato; vaga sem localização (ex.: remota) nunca é descartada.
 */
export function applyFeedFilter(
  jobs: FeedJob[],
  filter: FeedFilter,
  coords: { lat: number; lng: number } | null,
): FeedJob[] {
  return jobs.filter((job) => {
    if (filter.skills.length > 0 && !job.requiredSkills.some((s) => filter.skills.includes(s))) return false;
    if (distanceActive(filter) && coords && job.lat != null && job.lng != null) {
      if (distanceKm(coords, { lat: job.lat, lng: job.lng }) > filter.radiusKm) return false;
    }
    return true;
  });
}
