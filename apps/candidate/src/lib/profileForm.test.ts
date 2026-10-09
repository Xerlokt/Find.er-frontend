import { describe, expect, it } from 'vitest';
import { buildProfileInput, profileDefaults, profileSchema, type ProfileFormValues } from './profileForm';
import { RADIUS_UNLIMITED_KM } from './radius';
import type { CandidateProfile } from '../api/candidates';

const valid: ProfileFormValues = {
  name: 'Maria Clara',
  bio: '',
  professionId: 'frontend-dev',
  skills: ['react'],
  preferredModalities: ['REMOTE'],
  salary: '',
  radius: '50',
};

const errorOf = (v: Partial<ProfileFormValues>, field: keyof ProfileFormValues) => {
  const r = profileSchema.safeParse({ ...valid, ...v });
  return r.success ? undefined : r.error.issues.find((i) => i.path[0] === field)?.message;
};

describe('profileSchema', () => {
  it('aceita um perfil mínimo válido', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('nome é obrigatório (espaços não contam) e tem no máximo 100 caracteres', () => {
    expect(errorOf({ name: '   ' }, 'name')).toBe('como a gente te chama?');
    expect(errorOf({ name: 'a'.repeat(101) }, 'name')).toBe('máximo 100 caracteres');
    expect(errorOf({ name: 'a'.repeat(100) }, 'name')).toBeUndefined();
  });

  it('bio tem no máximo 500 caracteres', () => {
    expect(errorOf({ bio: 'a'.repeat(501) }, 'bio')).toBe('máximo 500 caracteres');
    expect(errorOf({ bio: 'a'.repeat(500) }, 'bio')).toBeUndefined();
  });

  it('exige área, ao menos 1 skill e ao menos 1 modalidade', () => {
    expect(errorOf({ professionId: '' }, 'professionId')).toBe('escolhe sua área');
    expect(errorOf({ skills: [] }, 'skills')).toBe('escolhe ao menos 1 skill');
    expect(errorOf({ preferredModalities: [] }, 'preferredModalities')).toBe('escolhe ao menos 1 modalidade');
  });

  it('salário é opcional, mas se vier precisa ser positivo (aceita vírgula)', () => {
    expect(errorOf({ salary: '' }, 'salary')).toBeUndefined();
    expect(errorOf({ salary: '5000' }, 'salary')).toBeUndefined();
    expect(errorOf({ salary: '5000,50' }, 'salary')).toBeUndefined();
    expect(errorOf({ salary: '0' }, 'salary')).toBe('valor inválido');
    expect(errorOf({ salary: '-10' }, 'salary')).toBe('valor inválido');
    expect(errorOf({ salary: 'abc' }, 'salary')).toBe('valor inválido');
  });

  it('raio precisa ser inteiro maior que 0', () => {
    expect(errorOf({ radius: '50' }, 'radius')).toBeUndefined();
    expect(errorOf({ radius: '0' }, 'radius')).toBeDefined();
    expect(errorOf({ radius: '2.5' }, 'radius')).toBeDefined();
    expect(errorOf({ radius: '' }, 'radius')).toBeDefined();
  });
});

describe('profileDefaults', () => {
  it('sem perfil começa vazio, com raio padrão de 50 km', () => {
    expect(profileDefaults(null)).toEqual({
      name: '',
      bio: '',
      professionId: '',
      skills: [],
      preferredModalities: [],
      salary: '',
      radius: '50',
    });
  });

  it('com perfil salvo preenche o formulário; raio 20000 volta como 200 (200+)', () => {
    const p = {
      id: 'p1',
      name: 'Maria',
      bio: 'oi',
      professionId: 'react',
      skills: ['react'],
      preferredModalities: ['HYBRID'],
      salaryExpectation: 4500,
      searchRadiusKm: RADIUS_UNLIMITED_KM,
    } as unknown as CandidateProfile;
    expect(profileDefaults(p)).toMatchObject({ name: 'Maria', bio: 'oi', salary: '4500', radius: '200' });
  });
});

describe('buildProfileInput', () => {
  it('payload mínimo: sem bio, salário nem coordenadas quando vazios', () => {
    expect(buildProfileInput(valid, null)).toEqual({
      name: 'Maria Clara',
      professionId: 'frontend-dev',
      skills: ['react'],
      preferredModalities: ['REMOTE'],
      searchRadiusKm: 50,
    });
  });

  it('inclui bio (sem espaços nas pontas), coordenadas e salário quando preenchidos', () => {
    const out = buildProfileInput({ ...valid, bio: '  dev  ', salary: '5000,5' }, { lat: -23.5, lng: -46.6 });
    expect(out).toMatchObject({ bio: 'dev', lat: -23.5, lng: -46.6, salaryExpectation: 5000.5 });
  });

  it('raio 200 ("200+") é enviado como o valor enorme', () => {
    expect(buildProfileInput({ ...valid, radius: '200' }, null).searchRadiusKm).toBe(RADIUS_UNLIMITED_KM);
  });
});
