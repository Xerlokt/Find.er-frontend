import { api } from './client';
import type { Modality } from '../data/taxonomy';
import type { DiscDimension } from '../data/disc';

export type Job = {
  id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  description: string;
  professionId: string;
  salaryMin: number | null;
  salaryMax: number | null;
  lat: number | null;
  lng: number | null;
  modality: Modality;
  requiredSkills: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  discProfile: DiscDimension | null;
};

/** O feed devolve a vaga + o score de afinidade (0–100) calculado para este candidato. */
export type FeedJob = Job & { fitScore: number };

export type FeedPage = { data: FeedJob[]; nextCursor: string | null };

export type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  rating: number;
  // o backend também devolve plan/credits para candidatos; o app ignora de propósito
};

export const getFeed = (cursor?: string, limit = 20) => {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cursor) qs.set('cursor', cursor);
  return api<FeedPage>(`/jobs/feed?${qs}`);
};

export const getJob = (id: string) => api<Job>(`/jobs/${id}`);

export const getCompany = (id: string) => api<Company>(`/companies/${id}`);

export type SwipeDirection = 'LIKE' | 'DISLIKE';

export type SwipeResult = {
  id: string;
  candidateId: string;
  jobId: string;
  direction: SwipeDirection;
  swipedAt: string;
  /** presente no LIKE: o backend abre o chat do match na hora */
  chatId: string | null;
};

export const postSwipe = (jobId: string, direction: SwipeDirection) =>
  api<SwipeResult>('/swipes', { method: 'POST', body: { jobId, direction } });
