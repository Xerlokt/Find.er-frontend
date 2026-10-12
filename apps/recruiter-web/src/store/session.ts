import { create } from 'zustand';

const REFRESH_KEY = 'finder.recruiter.refreshToken';

export type Role = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
export type Tokens = { accessToken: string; refreshToken: string };

type SessionState = {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: Role | null;
  emailVerified: boolean;
  email: string | null;
  hydrate: () => void;
  setTokens: (t: Tokens) => void;
  clear: () => void;
};

export function decodeJwt(token: string): { id?: string; email?: string; role?: Role; emailVerified?: boolean } {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(part)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

const persisted = {
  get: () => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(REFRESH_KEY, v);
    } catch {
      /* storage indisponível: a sessão vale só até recarregar */
    }
  },
  del: () => {
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  role: null,
  emailVerified: false,
  email: null,

  // Só o refresh token é persistido; o access token (15 min) fica em memória e é recriado via /auth/refresh.
  hydrate: () => set({ refreshToken: persisted.get(), hydrated: true }),

  setTokens: ({ accessToken, refreshToken }) => {
    const claims = decodeJwt(accessToken);
    set({ accessToken, refreshToken, userId: claims.id ?? null, role: claims.role ?? null, emailVerified: claims.emailVerified === true, email: claims.email ?? null });
    persisted.set(refreshToken);
  },

  clear: () => {
    set({ accessToken: null, refreshToken: null, userId: null, role: null, emailVerified: false, email: null });
    persisted.del();
  },
}));
