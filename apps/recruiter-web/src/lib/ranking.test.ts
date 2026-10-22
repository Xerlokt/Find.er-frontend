import { describe, expect, it } from 'vitest';
import { cardState, filterRanking, unlockRef } from './ranking';

const locked = { status: 'LOCKED' as const, unlockToken: 'tok' };
const revealed = { status: 'REVEALED' as const, candidateId: 'cand-1' };

describe('cardState', () => {
  it('candidato revelado (curtiu ou já desbloqueado) não precisa de saldo', () => {
    expect(cardState(revealed, 0, 2)).toBe('revealed');
  });

  it('censurado com saldo suficiente pode ser desbloqueado', () => {
    expect(cardState(locked, 2, 2)).toBe('unlockable');
    expect(cardState(locked, 10, 1)).toBe('unlockable');
  });

  it('censurado sem saldo suficiente fica bloqueado por créditos', () => {
    expect(cardState(locked, 1, 2)).toBe('insufficient-credits');
    expect(cardState(locked, 0, 1)).toBe('insufficient-credits');
  });

  it('saldo ainda não carregado: deixa tentar (o backend valida com 402)', () => {
    expect(cardState(locked, undefined, 2)).toBe('unlockable');
  });
});

describe('unlockRef', () => {
  it('usa o unlockToken opaco dos censurados', () => {
    expect(unlockRef(locked)).toBe('tok');
  });

  it('cai no candidateId quando existir e não houver token', () => {
    expect(unlockRef(revealed)).toBe('cand-1');
  });

  it('é undefined quando o item não traz nenhuma referência', () => {
    expect(unlockRef({ status: 'LOCKED' as const })).toBeUndefined();
  });
});

describe('filterRanking', () => {
  const items = [revealed, locked, { ...locked, unlockToken: 'tok2' }];

  it('all mantém todos', () => {
    expect(filterRanking(items, 'all')).toHaveLength(3);
  });

  it('revealed deixa só os liberados', () => {
    expect(filterRanking(items, 'revealed')).toEqual([revealed]);
  });

  it('locked deixa só os censurados', () => {
    expect(filterRanking(items, 'locked')).toHaveLength(2);
  });
});
