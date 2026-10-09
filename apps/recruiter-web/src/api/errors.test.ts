import { describe, expect, it } from 'vitest';
import { ApiError, friendlyMessage, parseApiError } from './errors';

describe('parseApiError', () => {
  it('lê {error, code}', () => {
    const e = parseApiError(409, { error: 'x', code: 'CONFLICT' });
    expect(e.status).toBe(409);
    expect(e.code).toBe('CONFLICT');
  });
  it('lê detalhes do Zod e retryAfter', () => {
    expect(parseApiError(400, { error: 'Validation error', details: [{ field: 'a', message: 'ruim' }] }).details).toHaveLength(1);
    expect(parseApiError(429, { retryAfter: 30 }).retryAfter).toBe(30);
  });
  it('tolera corpo vazio', () => {
    expect(parseApiError(500, undefined).message).toBe('Erro inesperado');
  });
});

describe('friendlyMessage', () => {
  it('traduz códigos de domínio do recrutador', () => {
    expect(friendlyMessage(new ApiError(402, 'x', 'INSUFFICIENT_CREDITS'))).toMatch(/créditos/);
    expect(friendlyMessage(new ApiError(409, 'x', 'ALREADY_UNLOCKED'))).toMatch(/já foi desbloqueado/);
  });
  it('mostra espera do rate limit', () => {
    expect(friendlyMessage(new ApiError(429, 'x', undefined, undefined, 12))).toMatch(/12s/);
  });
  it('rede', () => {
    expect(friendlyMessage(new ApiError(0, 'x', 'NETWORK'))).toMatch(/servidor/);
  });
});
