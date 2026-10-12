import { api, refreshSession } from './client';
import { useSession, type Tokens } from '../store/session';
import { useChatSeen } from '../store/chatSeen';
import { unregisterPush } from './push';

export async function login(email: string, password: string) {
  const tokens = await api<Tokens>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  await useSession.getState().setTokens(tokens);
}

export async function register(email: string, password: string) {
  const tokens = await api<Tokens>('/auth/register', {
    method: 'POST',
    body: { email, password, role: 'CANDIDATE' },
    auth: false,
  });
  await useSession.getState().setTokens(tokens);
}

/** Pede um novo código de verificação por email (204). */
export async function sendEmailCode() {
  await api('/auth/email/send', { method: 'POST' });
}

/** Confere o código; o servidor devolve tokens novos já com emailVerified. */
export async function verifyEmail(code: string) {
  const tokens = await api<Tokens>('/auth/email/verify', { method: 'POST', body: { code } });
  await useSession.getState().setTokens(tokens);
}

/** Corrige o email de uma conta não verificada; o servidor manda código novo e devolve tokens com o email atualizado. */
export async function changeEmail(email: string) {
  const tokens = await api<Tokens>('/auth/email/change', { method: 'POST', body: { email } });
  await useSession.getState().setTokens(tokens);
}

export async function logout() {
  const { refreshToken, clear } = useSession.getState();
  await unregisterPush();
  try {
    if (refreshToken) await api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
  } catch {
    // logout local mesmo se o servidor não responder
  } finally {
    await clear();
    await useChatSeen.getState().clear();
  }
}

export type RestoreResult = 'signedIn' | 'signedOut' | 'offline';

/**
 * Chamado no boot: transforma o refresh token salvo em uma sessão com access token.
 * `offline` = há sessão salva mas o servidor não respondeu (rede/5xx); o token é mantido para tentar de novo.
 */
export async function restoreSession(): Promise<RestoreResult> {
  const { hydrate } = useSession.getState();
  await hydrate();
  if (!useSession.getState().refreshToken) return 'signedOut';
  if (await refreshSession()) return 'signedIn';
  return useSession.getState().refreshToken ? 'offline' : 'signedOut';
}
