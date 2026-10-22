type JobRow = { views: number; likes: number; dislikes: number; likeRate: number | null };

export type StatsSort = 'likes' | 'views' | 'rate';

/** "63%" ou "—" enquanto ninguém reagiu. */
export const formatRate = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

/** Ordena do que mais atrai atenção para o que menos atrai (sem mutar a lista). */
export const sortJobs = <T extends JobRow>(jobs: T[], by: StatsSort): T[] => {
  const key = (j: T) => (by === 'likes' ? j.likes : by === 'views' ? j.views : (j.likeRate ?? -1));
  return [...jobs].sort((a, b) => key(b) - key(a) || b.views - a.views);
};

/** Vagas com visualização mas sem nenhuma reação ainda não dão base para comparar. */
export const hasSignal = (j: JobRow): boolean => j.likes + j.dislikes > 0;

/** Melhor e pior vaga por taxa de like; só existe quando há ao menos 2 vagas com reações. */
export const highlights = <T extends JobRow>(jobs: T[]): { best: T; worst: T } | null => {
  const rated = jobs.filter(hasSignal);
  if (rated.length < 2) return null;
  const sorted = sortJobs(rated, 'rate');
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return best.likeRate === worst.likeRate ? null : { best, worst };
};

/** Largura (0–100) de uma barra relativa ao maior valor da coluna. */
export const barWidth = (value: number, max: number): number => (max <= 0 ? 0 : Math.round((value / max) * 100));
