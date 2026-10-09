import { beforeEach, describe, expect, it } from 'vitest';
import { consumeDeckIntro, peekPose, resetDeckIntro } from './deckPeek';

describe('peekPose', () => {
  it('sem progresso (0) todas as cartas ficam na pilha normal', () => {
    for (const depth of [0, 1, 2]) {
      expect(peekPose(depth, 0)).toEqual({ x: 0, y: 0, rotate: 0 });
    }
  });

  it('a carta do topo só sobe um pouco, sem girar nem andar de lado', () => {
    const p = peekPose(0, 1);
    expect(p.y).toBeLessThan(0);
    expect(p.x).toBe(0);
    expect(p.rotate).toBe(0);
  });

  it('as de baixo abrem em leque para a esquerda, cada uma mais que a anterior', () => {
    const a = peekPose(1, 1);
    const b = peekPose(2, 1);
    expect(a.x).toBeLessThan(0);
    expect(a.rotate).toBeLessThan(0);
    expect(b.x).toBeLessThan(a.x);
    expect(b.rotate).toBeLessThan(a.rotate);
  });

  it('a abertura é proporcional ao progresso', () => {
    const half = peekPose(1, 0.5);
    const full = peekPose(1, 1);
    expect(half.x).toBeCloseTo(full.x / 2);
    expect(half.rotate).toBeCloseTo(full.rotate / 2);
  });

  it('o progresso fora de 0..1 é limitado', () => {
    expect(peekPose(1, 2)).toEqual(peekPose(1, 1));
    expect(peekPose(1, -1)).toEqual(peekPose(1, 0));
  });
});

describe('consumeDeckIntro', () => {
  beforeEach(resetDeckIntro);

  it('toca na primeira vez e não repete na mesma abertura do app', () => {
    expect(consumeDeckIntro(3)).toBe(true);
    expect(consumeDeckIntro(3)).toBe(false);
  });

  it('com menos de 2 cartas não há o que espiar e a animação não é gasta', () => {
    expect(consumeDeckIntro(1)).toBe(false);
    expect(consumeDeckIntro(0)).toBe(false);
    expect(consumeDeckIntro(2)).toBe(true);
  });
});
