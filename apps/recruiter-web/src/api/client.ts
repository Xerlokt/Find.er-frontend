import { API_URL, REQUEST_TIMEOUT_MS } from '../config';
import { useSession, type Tokens } from '../store/session';
import { ApiError, parseApiError } from './errors';

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** false para rotas públicas (login/register/refresh) */
  auth?: boolean;
};

async function rawFetch(path: string, { method = 'GET', body, auth = true }: Options, token: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    const timedOut = controller.signal.aborted;
    throw new ApiError(0, timedOut ? 'Tempo esgotado' : 'Falha de rede', timedOut ? 'TIMEOUT' : 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// Uma única renovação em andamento: o refresh token rotaciona e reutilizar o antigo derruba a família inteira.
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken, setTokens, clear } = useSession.getState();
    if (!refreshToken) return false;
    try {
      const res = await rawFetch('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false }, null);
      if (!res.ok) {
        if (res.status >= 500) return false; // servidor com problema, não token inválido
        clear();
        return false;
      }
      setTokens((await readBody(res)) as Tokens);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.isNetwork) return false;
      clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const auth = opts.auth ?? true;
  let res = await rawFetch(path, opts, useSession.getState().accessToken);

  if (res.status === 401 && auth && useSession.getState().refreshToken) {
    if (await refreshSession()) {
      res = await rawFetch(path, opts, useSession.getState().accessToken);
    }
  }

  const body = await readBody(res);
  if (!res.ok) throw parseApiError(res.status, body);
  return body as T;
}
