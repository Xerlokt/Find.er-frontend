import { api } from './client';
import { ApiError } from './errors';
import type { Modality } from '../data/taxonomy';
import type { DiscDimension } from '../data/disc';

export type CandidateProfile = {
  /** id do PERFIL (usado nas rotas de DISC), diferente do id do usuário */
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  professionId: string;
  skills: string[];
  preferredModalities: Modality[];
  searchRadiusKm: number;
  salaryExpectation: number | null;
};

export type ProfileInput = {
  name: string;
  bio?: string;
  lat?: number;
  lng?: number;
  professionId: string;
  skills: string[];
  preferredModalities: Modality[];
  salaryExpectation?: number;
  searchRadiusKm?: number;
};

/** null quando o candidato ainda não criou o perfil (404) */
export async function getMyProfile(): Promise<CandidateProfile | null> {
  try {
    return await api<CandidateProfile>('/candidates/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const saveMyProfile = (input: ProfileInput) =>
  api<CandidateProfile>('/candidates/me', { method: 'PUT', body: input });

export async function getDisc(profileId: string): Promise<DiscDimension | null> {
  try {
    const res = await api<{ dominant: DiscDimension }>(`/candidates/${profileId}/disc`);
    return res.dominant;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const submitDisc = (profileId: string, answers: DiscDimension[]) =>
  api<{ dominant: DiscDimension }>(`/candidates/${profileId}/disc`, { method: 'POST', body: { answers } });
