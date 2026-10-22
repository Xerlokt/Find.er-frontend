import { describe, expect, it } from 'vitest';
import { formatPrice, isLowBalance, packageName, pricePerCredit, transactionLabel } from './credits';

describe('formatPrice', () => {
  it('formata centavos em reais no padrão brasileiro', () => {
    expect(formatPrice(2990)).toBe('R$ 29,90');
    expect(formatPrice(11990)).toBe('R$ 119,90');
    expect(formatPrice(500)).toBe('R$ 5,00');
  });

  it('usa ponto de milhar a partir de mil reais', () => {
    expect(formatPrice(123456)).toBe('R$ 1.234,56');
  });
});

describe('pricePerCredit', () => {
  it('preço por crédito arredondado ao centavo', () => {
    expect(pricePerCredit({ credits: 10, priceCents: 2990 })).toBe('R$ 2,99');
    expect(pricePerCredit({ credits: 50, priceCents: 11990 })).toBe('R$ 2,40');
  });
});

describe('isLowBalance', () => {
  it('saldo abaixo do custo de um desbloqueio é baixo', () => {
    expect(isLowBalance(0, 2)).toBe(true);
    expect(isLowBalance(1, 2)).toBe(true);
    expect(isLowBalance(2, 2)).toBe(false);
    expect(isLowBalance(10, 1)).toBe(false);
  });

  it('saldo ainda não carregado não é considerado baixo', () => {
    expect(isLowBalance(undefined, 2)).toBe(false);
  });
});

describe('packageName', () => {
  it('nomes amigáveis e fallback no id', () => {
    expect(packageName('starter')).toBe('Inicial');
    expect(packageName('pro')).toBe('Profissional');
    expect(packageName('scale')).toBe('Escala');
    expect(packageName('outro')).toBe('outro');
  });
});

describe('transactionLabel', () => {
  it('rotula cada motivo do extrato', () => {
    expect(transactionLabel('purchase:starter')).toBe('Compra · pacote Inicial');
    expect(transactionLabel('candidate_unlock')).toBe('Desbloqueio de candidato');
    expect(transactionLabel('admin_grant')).toBe('Crédito concedido pela plataforma');
  });

  it('motivo desconhecido aparece como veio', () => {
    expect(transactionLabel('algo_novo')).toBe('algo_novo');
  });
});
