import { create } from 'zustand';
import { DEFAULT_FEED_FILTER, type FeedFilter } from '../lib/feedFilter';

// Em memória: o filtro vale enquanto o app está aberto e some ao fechar (o feed volta a mostrar tudo).
type State = {
  filter: FeedFilter;
  set: (f: FeedFilter) => void;
  reset: () => void;
};

const fresh = (): FeedFilter => ({ ...DEFAULT_FEED_FILTER, skills: [] });

export const useFeedFilter = create<State>((set) => ({
  filter: fresh(),
  set: (filter) => set({ filter }),
  reset: () => set({ filter: fresh() }),
}));
