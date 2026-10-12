import { describe, expect, it } from 'vitest';
import { isCodeComplete, resendWait, sanitizeCode } from './emailCode';

describe('sanitizeCode', () => {
  it('tira tudo que não é dígito e limita a 6', () => {
    expect(sanitizeCode('12a3-4 56789')).toBe('123456');
    expect(sanitizeCode('')).toBe('');
  });
});

describe('isCodeComplete', () => {
  it('só com 6 dígitos', () => {
    expect(isCodeComplete('12345')).toBe(false);
    expect(isCodeComplete('123456')).toBe(true);
  });
});

describe('resendWait', () => {
  it('conta regressiva de 60s e para em 0', () => {
    expect(resendWait(0, 0)).toBe(60);
    expect(resendWait(0, 1500)).toBe(59);
    expect(resendWait(0, 60_000)).toBe(0);
    expect(resendWait(0, 90_000)).toBe(0);
  });
});
