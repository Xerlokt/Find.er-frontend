import { create } from 'zustand';
import type { Notice } from '../lib/inAppNotice';

// Em memória: aviso in-app atual (banner) e qual conversa está aberta (para não avisar do que o usuário já está lendo).
type State = {
  current: Notice | null;
  openChatId: string | null;
  show: (n: Notice) => void;
  dismiss: (id: string) => void;
  setOpenChat: (chatId: string) => void;
  clearOpenChat: (chatId: string) => void;
  reset: () => void;
};

export const useNotice = create<State>((set) => ({
  current: null,
  openChatId: null,
  show: (current) => set({ current }),
  dismiss: (id) => set((s) => (s.current?.id === id ? { current: null } : s)),
  setOpenChat: (openChatId) => set({ openChatId }),
  clearOpenChat: (chatId) => set((s) => (s.openChatId === chatId ? { openChatId: null } : s)),
  reset: () => set({ current: null, openChatId: null }),
}));
