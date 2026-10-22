type RankingRef = { status: 'REVEALED' | 'LOCKED'; candidateId?: string; unlockToken?: string };

export type CardState = 'revealed' | 'unlockable' | 'insufficient-credits';

/**
 * Estado do card no ranking. `credits` indefinido (saldo ainda carregando) deixa tentar:
 * quem manda de verdade é o backend, que responde 402 INSUFFICIENT_CREDITS.
 */
export const cardState = (item: RankingRef, credits: number | undefined, cost: number): CardState => {
  if (item.status === 'REVEALED') return 'revealed';
  if (credits !== undefined && credits < cost) return 'insufficient-credits';
  return 'unlockable';
};

/** Referência enviada ao /unlock: o token opaco dos censurados (o backend nunca manda o id real deles). */
export const unlockRef = (item: RankingRef): string | undefined => item.unlockToken ?? item.candidateId;

export type RankingFilter = 'all' | 'revealed' | 'locked';

export const filterRanking = <T extends { status: 'REVEALED' | 'LOCKED' }>(items: T[], filter: RankingFilter): T[] =>
  filter === 'all' ? items : items.filter((it) => it.status === (filter === 'revealed' ? 'REVEALED' : 'LOCKED'));
