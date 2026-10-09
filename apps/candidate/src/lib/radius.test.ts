import { describe, expect, it } from 'vitest';
import {
  RADIUS_DEFAULT_KM,
  RADIUS_MAX_KM,
  RADIUS_MIN_KM,
  RADIUS_STEP_KM,
  RADIUS_UNLIMITED_KM,
  radiusFromSaved,
  radiusToPayload,
} from './radius';
import { ratioFromValue, valueFromRatio } from './slider';

describe('radiusToPayload', () => {
  it('valores abaixo do máximo são enviados como estão', () => {
    expect(radiusToPayload(5)).toBe(5);
    expect(radiusToPayload(50)).toBe(50);
    expect(radiusToPayload(195)).toBe(195);
  });

  it('200 ("200+") envia o valor enorme que faz a distância não pesar', () => {
    expect(radiusToPayload(RADIUS_MAX_KM)).toBe(RADIUS_UNLIMITED_KM);
    expect(RADIUS_UNLIMITED_KM).toBeGreaterThan(10000);
  });

  it('o valor enviado é sempre inteiro positivo (exigência do backend)', () => {
    for (let v = RADIUS_MIN_KM; v <= RADIUS_MAX_KM; v += RADIUS_STEP_KM) {
      const out = radiusToPayload(v);
      expect(Number.isInteger(out) && out > 0).toBe(true);
    }
  });
});

describe('radiusFromSaved', () => {
  it('sem valor salvo usa o padrão de 50 km', () => {
    expect(RADIUS_DEFAULT_KM).toBe(50);
    expect(radiusFromSaved(undefined)).toBe(50);
    expect(radiusFromSaved(null)).toBe(50);
  });

  it('valor salvo dentro da faixa é mantido', () => {
    expect(radiusFromSaved(30)).toBe(30);
  });

  it('valor salvo >= 200 (inclusive o 20000 enviado pelo app) volta como 200+', () => {
    expect(radiusFromSaved(200)).toBe(RADIUS_MAX_KM);
    expect(radiusFromSaved(RADIUS_UNLIMITED_KM)).toBe(RADIUS_MAX_KM);
  });

  it('valor salvo abaixo do mínimo ou inválido é ajustado ao mínimo/padrão', () => {
    expect(radiusFromSaved(1)).toBe(RADIUS_MIN_KM);
    expect(radiusFromSaved(0)).toBe(RADIUS_DEFAULT_KM);
  });
});

describe('slider: valueFromRatio / ratioFromValue', () => {
  it('extremos da barra dão min e max', () => {
    expect(valueFromRatio(0, 5, 200, 5)).toBe(5);
    expect(valueFromRatio(1, 5, 200, 5)).toBe(200);
  });

  it('arredonda para o passo mais próximo', () => {
    expect(valueFromRatio(0.49, 5, 200, 5)).toBe(100);
    expect(valueFromRatio(0.26, 5, 200, 5)).toBe(55);
  });

  it('posições fora da barra são limitadas ao min/max', () => {
    expect(valueFromRatio(-0.4, 5, 200, 5)).toBe(5);
    expect(valueFromRatio(1.7, 5, 200, 5)).toBe(200);
  });

  it('ratioFromValue é o inverso e limita a [0,1]', () => {
    expect(ratioFromValue(5, 5, 200)).toBe(0);
    expect(ratioFromValue(200, 5, 200)).toBe(1);
    expect(ratioFromValue(999, 5, 200)).toBe(1);
    expect(ratioFromValue(-3, 5, 200)).toBe(0);
  });
});
