import { describe, expect, it } from 'vitest';
import { onboardingInitialRoute, resolveRoute } from './routes';

describe('resolveRoute', () => {
  it('sem login vai para (auth), sem esperar o perfil', () => {
    expect(resolveRoute({ signedIn: false, profile: 'pending', pendingDisc: false })).toBe('auth');
  });

  it('sem login mas com sessão salva e servidor fora do ar vai para offline, não para (auth)', () => {
    expect(resolveRoute({ signedIn: false, offline: true, profile: 'pending', pendingDisc: false })).toBe('offline');
  });

  it('logado nunca é offline, mesmo que a flag sobre', () => {
    expect(resolveRoute({ signedIn: true, offline: true, profile: 'ready', pendingDisc: false })).toBe('app');
  });

  it('logado com email não verificado vai para verify-email, antes mesmo do perfil', () => {
    expect(resolveRoute({ signedIn: true, emailVerified: false, profile: 'pending', pendingDisc: false })).toBe('verify-email');
    expect(resolveRoute({ signedIn: true, emailVerified: false, profile: 'ready', pendingDisc: false })).toBe('verify-email');
  });

  it('logado com email verificado segue o fluxo normal', () => {
    expect(resolveRoute({ signedIn: true, emailVerified: true, profile: 'ready', pendingDisc: false })).toBe('app');
  });

  it('logado com consulta do perfil em andamento fica em loading', () => {
    expect(resolveRoute({ signedIn: true, profile: 'pending', pendingDisc: false })).toBe('loading');
  });

  it('logado com consulta do perfil falha mostra erro (não dá pra escolher rota)', () => {
    expect(resolveRoute({ signedIn: true, profile: 'error', pendingDisc: false })).toBe('error');
  });

  it('logado sem perfil (404) vai para o onboarding', () => {
    expect(resolveRoute({ signedIn: true, profile: 'missing', pendingDisc: false })).toBe('onboarding');
  });

  it('logado com perfil e DISC pendente continua no onboarding', () => {
    expect(resolveRoute({ signedIn: true, profile: 'ready', pendingDisc: true })).toBe('onboarding');
  });

  it('logado com perfil e sem DISC pendente vai para o app', () => {
    expect(resolveRoute({ signedIn: true, profile: 'ready', pendingDisc: false })).toBe('app');
  });
});

describe('onboardingInitialRoute', () => {
  // regressão: sem rota inicial o expo-router abria "disc" (ordem alfabética) e girava para sempre
  it('sem perfil abre profile-setup, nunca disc', () => {
    expect(onboardingInitialRoute(false)).toBe('profile-setup');
  });

  it('com perfil criado abre o teste DISC', () => {
    expect(onboardingInitialRoute(true)).toBe('disc');
  });
});
