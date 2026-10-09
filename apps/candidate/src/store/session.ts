import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'finder.refreshToken';

export type Role = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
export type Tokens = { accessToken: string; refreshToken: string };

type SessionState = {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: Role | null;
  hydrate: () => Promise<void>;
  setTokens: (t: Tokens) => Promise<void>;
  clear: () => Promise<void>;
};

function decodeJwt(token: string): { id?: string; role?: Role } {
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

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  role: null,

  // Só o refresh token é persistido; o access token (15 min) fica em memória e é recriado via /auth/refresh.
  hydrate: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      set({ refreshToken, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    const claims = decodeJwt(accessToken);
    set({ accessToken, refreshToken, userId: claims.id ?? null, role: claims.role ?? null });
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },

  clear: async () => {
    set({ accessToken: null, refreshToken: null, userId: null, role: null });
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {}
  },
}));
