import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getCompany, getFeed, getJob, postSwipe, type FeedJob, type FeedPage, type SwipeDirection } from './jobs';

export const feedKey = ['feed'] as const;

/**
 * Feed paginado por cursor. staleTime infinito: a lista só muda quando o usuário pede
 * (o backend já exclui o que foi swipado), então refetch automático só reordenaria o deck.
 */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: feedKey,
    queryFn: ({ pageParam }) => getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: FeedPage) => last.nextCursor ?? undefined,
    staleTime: Infinity,
  });
}

export function flattenFeed(data: InfiniteData<FeedPage> | undefined): FeedJob[] {
  const seen = new Set<string>();
  const out: FeedJob[] = [];
  for (const page of data?.pages ?? []) {
    for (const job of page.data) {
      if (!seen.has(job.id)) {
        seen.add(job.id);
        out.push(job);
      }
    }
  }
  return out;
}

/** Empresa de uma vaga. O feed não traz nome/logo, então cada companyId é buscado uma vez e cacheado. */
export const useCompany = (companyId: string | undefined) =>
  useQuery({
    queryKey: ['company', companyId],
    queryFn: () => getCompany(companyId!),
    enabled: !!companyId,
    staleTime: Infinity,
  });

/** Vaga pelo id: usa o feed em cache (tem fitScore) e cai no GET /jobs/:id. */
export function useJob(id: string) {
  const qc = useQueryClient();
  const cached = flattenFeed(qc.getQueryData<InfiniteData<FeedPage>>(feedKey)).find((j) => j.id === id);
  const query = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
    enabled: !cached,
    staleTime: Infinity,
  });
  return { job: cached ?? (query.data ? { ...query.data, fitScore: null } : undefined), query };
}

export function useSwipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, direction }: { jobId: string; direction: SwipeDirection }) => postSwipe(jobId, direction),
    onSuccess: (res) => {
      // LIKE abre um chat: a lista de conversas precisa refletir
      if (res.chatId) qc.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
