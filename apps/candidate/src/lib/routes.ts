export type ProfileStatus = 'pending' | 'error' | 'missing' | 'ready';
export type RouteTarget = 'auth' | 'offline' | 'loading' | 'error' | 'verify-email' | 'onboarding' | 'app';

/**
 * Decide o grupo de rotas: sem login → auth (ou offline, se havia sessão salva e o servidor não respondeu no boot);
 * logado com email não verificado → verify-email; logado sem perfil ou com DISC pendente → onboarding; senão → app.
 */
export function resolveRoute(s: {
  signedIn: boolean;
  emailVerified?: boolean;
  offline?: boolean;
  profile: ProfileStatus;
  pendingDisc: boolean;
}): RouteTarget {
  if (!s.signedIn) return s.offline ? 'offline' : 'auth';
  if (s.emailVerified === false) return 'verify-email';
  if (s.profile === 'pending') return 'loading';
  if (s.profile === 'error') return 'error';
  if (s.profile === 'missing' || s.pendingDisc) return 'onboarding';
  return 'app';
}

/** Sem rota inicial o expo-router abre a 1ª em ordem alfabética ("disc"), que depende de um perfil que ainda não existe. */
export function onboardingInitialRoute(hasProfile: boolean): 'profile-setup' | 'disc' {
  return hasProfile ? 'disc' : 'profile-setup';
}
