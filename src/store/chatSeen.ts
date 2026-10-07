import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { markSeen as withSeen, type SeenMap } from '../lib/unread';

const KEY = 'finder.chatSeen';

type State = {
  hydrated: boolean;
  seen: SeenMap;
  hydrate: () => Promise<void>;
  markSeen: (chatId: string, createdAt: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useChatSeen = create<State>((set, get) => ({
  hydrated: false,
  seen: {},

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      set({ seen: parsed && typeof parsed === 'object' ? parsed : {}, hydrated: true });
    } catch {
      set({ seen: {}, hydrated: true });
    }
  },

  markSeen: async (chatId, createdAt) => {
    const next = withSeen(get().seen, chatId, createdAt);
    if (next === get().seen) return;
    set({ seen: next });
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    } catch {}
  },

  clear: async () => {
    set({ seen: {} });
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
  },
}));
