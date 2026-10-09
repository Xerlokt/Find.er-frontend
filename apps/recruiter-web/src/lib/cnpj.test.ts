import { describe, expect, it } from 'vitest';
import { formatCnpj, isValidCnpj, onlyDigits } from './cnpj';

describe('cnpj', () => {
  it('valida dígitos verificadores', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('00000000000191')).toBe(true);
    expect(isValidCnpj('11222333000182')).toBe(false);
  });
  it('rejeita tamanho errado e repetidos', () => {
    expect(isValidCnpj('123')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });
  it('formata progressivamente enquanto digita', () => {
    expect(formatCnpj('11')).toBe('11');
    expect(formatCnpj('112223')).toBe('11.222.3');
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatCnpj('11222333000181999')).toBe('11.222.333/0001-81');
  });
  it('onlyDigits limita a 14', () => {
    expect(onlyDigits('11.222.333/0001-81x9')).toBe('11222333000181');
  });
});
