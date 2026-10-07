import { describe, expect, it } from 'vitest';
import { profileView } from './profileView';
import { RADIUS_UNLIMITED_KM } from './radius';
import type { CandidateProfile } from '../api/candidates';

const profile = (over: Partial<CandidateProfile> = {}): CandidateProfile => ({
  id: 'p1',
  userId: 'u1',
  name: 'Maria Clara Souza',
  bio: 'Dev apaixonada por UI',
  lat: -23.5,
  lng: -46.6,
  professionId: 'frontend-dev',
  skills: ['react', 'typescript'],
  preferredModalities: ['REMOTE', 'HYBRID'],
  searchRadiusKm: 50,
  salaryExpectation: 14000,
  ...over,
});

describe('profileView: identidade', () => {
  it('nome, inicial minúscula e área traduzida', () => {
    const v = profileView(profile(), null);
    expect(v).toMatchObject({ name: 'Maria Clara Souza', initial: 'm', professionLabel: 'Frontend' });
  });

  it('área desconhecida cai no próprio id', () => {
    expect(profileView(profile({ professionId: 'xyz' }), null).professionLabel).toBe('xyz');
  });

  it('bio vazia ou só espaços vira null (a tela mostra o convite para escrever)', () => {
    expect(profileView(profile({ bio: null }), null).bio).toBeNull();
    expect(profileView(profile({ bio: '   ' }), null).bio).toBeNull();
    expect(profileView(profile({ bio: ' oi ' }), null).bio).toBe('oi');
  });
});

describe('profileView: skills e modalidades', () => {
  it('traduz ids para nomes mantendo a ordem salva', () => {
    const v = profileView(profile({ skills: ['typescript', 'react', 'nextjs'] }), null);
    expect(v.skills).toEqual(['TypeScript', 'React', 'Next.js']);
  });

  it('skill desconhecida aparece pelo id em vez de sumir', () => {
    expect(profileView(profile({ skills: ['coisa-nova'] }), null).skills).toEqual(['coisa-nova']);
  });

  it('modalidades em português', () => {
    expect(profileView(profile({ preferredModalities: ['REMOTE', 'IN_PERSON'] }), null).modalities).toEqual([
      'Remoto',
      'Presencial',
    ]);
  });
});

describe('profileView: salário', () => {
  it('formata a expectativa salarial', () => {
    expect(profileView(profile({ salaryExpectation: 14000 }), null).salary).toBe('R$ 14k');
    expect(profileView(profile({ salaryExpectation: 5500 }), null).salary).toBe('R$ 5.5k');
  });

  it('sem expectativa mostra "não informado"', () => {
    expect(profileView(profile({ salaryExpectation: null }), null).salary).toBe('não informado');
  });
});

describe('profileView: raio e localização', () => {
  it('raio em km', () => {
    expect(profileView(profile({ searchRadiusKm: 50 }), null).radius).toBe('50 km');
  });

  it('raio no máximo ("200+", inclusive o 20000 enviado pelo app) mostra 200+ km', () => {
    expect(profileView(profile({ searchRadiusKm: 200 }), null).radius).toBe('200+ km');
    expect(profileView(profile({ searchRadiusKm: RADIUS_UNLIMITED_KM }), null).radius).toBe('200+ km');
  });

  it('informa se a localização foi compartilhada', () => {
    expect(profileView(profile(), null).hasLocation).toBe(true);
    expect(profileView(profile({ lat: null, lng: null }), null).hasLocation).toBe(false);
    expect(profileView(profile({ lat: -23.5, lng: null }), null).hasLocation).toBe(false);
  });
});

describe('profileView: DISC', () => {
  it('sem teste feito convida a fazer', () => {
    const v = profileView(profile(), null);
    expect(v.disc).toBeNull();
    expect(v.discActionLabel).toBe('fazer o teste DISC');
  });

  it('com resultado mostra letra, nome e descrição e permite refazer', () => {
    const v = profileView(profile(), 'C');
    expect(v.disc).toEqual({ letter: 'C', name: 'Conformidade', blurb: 'analítico, preciso e detalhista' });
    expect(v.discActionLabel).toBe('refazer o teste DISC');
  });
});
