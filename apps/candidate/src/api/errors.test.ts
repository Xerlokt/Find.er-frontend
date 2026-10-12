import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: null } }));

import { ApiError, friendlyMessage, parseApiError } from './errors';

describe('parseApiError', () => {
  it('lê {error, code}', () => {
    const e = parseApiError(401, { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    expect(e).toMatchObject({ status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  });

  it('lê erro de validação Zod com details', () => {
    const e = parseApiError(400, {
      error: 'Validation error',
      details: [{ field: 'password', message: 'mínimo 8' }],
    });
    expect(e.details).toEqual([{ field: 'password', message: 'mínimo 8' }]);
  });

  it('lê 429 com retryAfter e usa "message" quando não há "error"', () => {
    const e = parseApiError(429, { statusCode: 429, message: 'Too many', retryAfter: 30 });
    expect(e).toMatchObject({ status: 429, message: 'Too many', retryAfter: 30 });
  });

  it('corpo vazio ou inválido vira "Erro inesperado"', () => {
    expect(parseApiError(500, undefined).message).toBe('Erro inesperado');
    expect(parseApiError(500, 'texto').message).toBe('Erro inesperado');
  });
});

describe('friendlyMessage', () => {
  it('erro desconhecido (não ApiError) tem mensagem genérica', () => {
    expect(friendlyMessage(new Error('x'))).toMatch(/algo deu errado/);
  });

  it('falha de rede e timeout (status 0) avisam sobre conexão', () => {
    expect(friendlyMessage(new ApiError(0, 'Falha de rede', 'NETWORK'))).toMatch(/não consegui falar com o servidor/);
    expect(friendlyMessage(new ApiError(0, 'Tempo esgotado', 'TIMEOUT'))).toMatch(/não consegui falar com o servidor/);
  });

  it('mapeia códigos conhecidos', () => {
    expect(friendlyMessage(parseApiError(401, { error: 'x', code: 'INVALID_CREDENTIALS' }))).toBe('email ou senha incorretos');
    expect(friendlyMessage(parseApiError(409, { error: 'x', code: 'CONFLICT' }))).toBe('esse email já tá em uso');
    expect(friendlyMessage(parseApiError(403, { error: 'x', code: 'FORBIDDEN' }))).toBe('você não tem permissão pra isso');
    expect(friendlyMessage(parseApiError(404, { error: 'x', code: 'NOT_FOUND' }))).toBe('não encontramos isso');
    expect(friendlyMessage(parseApiError(409, { error: 'x', code: 'ALREADY_VERIFIED' }))).toBe('esse email já foi verificado');
    expect(friendlyMessage(parseApiError(400, { error: 'x', code: 'INVALID_CODE' }))).toBe('código incorreto, confere e tenta de novo');
    expect(friendlyMessage(parseApiError(410, { error: 'x', code: 'CODE_EXPIRED' }))).toBe('esse código expirou. pede um novo');
    expect(friendlyMessage(parseApiError(429, { error: 'x', code: 'TOO_MANY_ATTEMPTS' }))).toBe('muitas tentativas erradas. pede um novo código');
  });

  it('429 mostra o tempo de espera quando existe', () => {
    expect(friendlyMessage(parseApiError(429, { retryAfter: 12 }))).toBe('calma! tenta de novo em 12s');
    expect(friendlyMessage(parseApiError(429, {}))).toBe('muitas tentativas, tenta de novo em instantes');
  });

  it('erro de validação junta as mensagens dos campos', () => {
    const e = parseApiError(400, {
      error: 'Validation error',
      details: [
        { field: 'a', message: 'um' },
        { field: 'b', message: 'dois' },
      ],
    });
    expect(friendlyMessage(e)).toBe('um • dois');
  });

  it('5xx avisa que o servidor falhou', () => {
    expect(friendlyMessage(parseApiError(503, {}))).toBe('o servidor falhou, tenta de novo em instantes');
  });

  it('outros erros devolvem a mensagem do backend', () => {
    expect(friendlyMessage(parseApiError(400, { error: 'Algo específico' }))).toBe('Algo específico');
  });
});
