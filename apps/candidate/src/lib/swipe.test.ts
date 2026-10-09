import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));

import { swipeDirection, swipeFailure } from './swipe';
import { ApiError, parseApiError } from '../api/errors';

describe('swipeDirection', () => {
  it('direita é LIKE e esquerda é DISLIKE', () => {
    expect(swipeDirection('right')).toBe('LIKE');
    expect(swipeDirection('left')).toBe('DISLIKE');
  });
});

describe('swipeFailure', () => {
  it('409 DUPLICATE_SWIPE: a vaga já foi swipada, some do deck sem aviso', () => {
    const e = parseApiError(409, { error: 'dup', code: 'DUPLICATE_SWIPE' });
    expect(swipeFailure(e)).toEqual({ restore: false, notice: null });
  });

  it('429: a vaga volta ao deck e avisa o tempo de espera', () => {
    const e = parseApiError(429, { retryAfter: 20 });
    expect(swipeFailure(e)).toEqual({ restore: true, notice: 'calma! tenta de novo em 20s' });
  });

  it('falha de rede: a vaga volta ao deck com aviso de conexão', () => {
    const r = swipeFailure(new ApiError(0, 'Falha de rede', 'NETWORK'));
    expect(r.restore).toBe(true);
    expect(r.notice).toMatch(/não consegui falar com o servidor/);
  });

  it('409 com outro código não é duplicata: volta ao deck', () => {
    const e = parseApiError(409, { error: 'x', code: 'CONFLICT' });
    expect(swipeFailure(e).restore).toBe(true);
  });

  it('erro desconhecido volta ao deck com mensagem genérica', () => {
    expect(swipeFailure(new Error('x'))).toEqual({ restore: true, notice: expect.stringMatching(/algo deu errado/) });
  });
});
