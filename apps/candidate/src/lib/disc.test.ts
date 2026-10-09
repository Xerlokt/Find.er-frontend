import { describe, expect, it } from 'vitest';
import { advanceDisc } from './disc';
import { DISC_LABELS, DISC_QUESTIONS } from '../data/disc';

describe('dados do DISC', () => {
  it('são 4 perguntas, que o backend exige (4 respostas)', () => {
    expect(DISC_QUESTIONS).toHaveLength(4);
  });

  it('cada pergunta tem exatamente uma opção para D, I, S e C', () => {
    for (const q of DISC_QUESTIONS) {
      expect(q.options.map((o) => o.dimension).sort()).toEqual(['C', 'D', 'I', 'S']);
    }
  });

  it('há rótulo para as 4 dimensões', () => {
    for (const d of ['D', 'I', 'S', 'C'] as const) {
      expect(DISC_LABELS[d].name).toBeTruthy();
      expect(DISC_LABELS[d].blurb).toBeTruthy();
    }
  });
});

describe('advanceDisc', () => {
  it('uma resposta no meio do teste avança de pergunta e ainda não envia', () => {
    expect(advanceDisc([], 'D')).toEqual({ done: false, answers: ['D'] });
    expect(advanceDisc(['D', 'I'], 'S')).toEqual({ done: false, answers: ['D', 'I', 'S'] });
  });

  it('a última resposta completa o teste, na ordem das perguntas', () => {
    expect(advanceDisc(['D', 'I', 'S'], 'C')).toEqual({ done: true, answers: ['D', 'I', 'S', 'C'] });
  });

  it('não altera o array recebido', () => {
    const prev = ['D'] as const;
    advanceDisc([...prev], 'I');
    expect(prev).toEqual(['D']);
  });
});
