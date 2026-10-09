import { api } from './client';
import { useSession, type Tokens } from '../store/session';
import type { Modality } from '../data/taxonomy';

// ---------- tipos (espelham Backend_Find.er) ----------
export type DiscLetter = 'D' | 'I' | 'S' | 'C';

export type Job = {
  id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  description: string;
  professionId: string;
  salaryMin: number | null;
  salaryMax: number | null;
  modality: Modality;
  requiredSkills: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  discProfile: DiscLetter | null;
};

export type JobInput = {
  title: string;
  description: string;
  professionId: string;
  modality: Modality;
  requiredSkills: string[];
  expiresAt: string;
  salaryMin?: number;
  salaryMax?: number;
  discProfile?: DiscLetter | null;
};

export type Company = {
  id: string;
  name: string;
  cnpj?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  city?: string | null;
  state?: string | null;
  logoUrl: string | null;
  description: string | null;
  rating: number;
  plan: string;
  credits: number;
};

export type RecruiterProfile = { id: string; userId: string; companyId: string };

export type FullProfile = {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  skills: string[];
  professionId: string;
  preferredModalities: Modality[];
  salaryExpectation: number | null;
};
export type CensoredProfile = {
  name: null;
  avatarUrl: null;
  bio: null;
  matchingSkills: string[];
  fitReasons: string[];
  discProfile?: DiscLetter;
};
export type RankingItem = {
  /** só vem para quem curtiu a vaga ou já foi desbloqueado */
  candidateId?: string;
  fitScore: number;
  distanceKm: number | null;
  rank: number;
  profile: FullProfile | CensoredProfile;
};
export const isCensored = (p: RankingItem['profile']): p is CensoredProfile => p.name === null;

export type ChatSummary = {
  id: string;
  jobId: string;
  initiatedBy: 'MATCH' | 'CREDIT';
  isActive: boolean;
  createdAt: string;
  candidateName: string;
  candidateUserId: string;
  companyName: string;
  recruiterUserId: string;
};
export type Message = { id: string; chatId: string; senderId: string; content: string; createdAt: string; readAt: string | null };
export type MessagesPage = { data: Message[]; nextCursor: string | null };

export type UnlockResult = { id: string; chatId: string; creditsCost: number; profile: FullProfile | null };

// ---------- auth ----------
const adopt = async (p: Promise<Tokens>) => {
  useSession.getState().setTokens(await p);
};

export const login = (email: string, password: string) =>
  adopt(api<Tokens>('/auth/login', { method: 'POST', body: { email, password }, auth: false }));

export type CnpjPreview = {
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  status: string;
  city: string | null;
  state: string | null;
  /** situação cadastral ATIVA na Receita */
  active: boolean;
  alreadyRegistered: boolean;
};

/** Consulta pública (via backend) para pré-visualizar a empresa antes de cadastrar. */
export const previewCnpj = (cnpj: string) => api<CnpjPreview>(`/auth/cnpj/${cnpj}`, { auth: false });

/** Cadastro da conta da EMPRESA: cria usuário RECRUITER + empresa + vínculo, validando o CNPJ na Receita. */
export const registerCompany = (input: { cnpj: string; email: string; password: string; description?: string }) =>
  adopt(api<Tokens>('/auth/register-company', { method: 'POST', body: input, auth: false }));

export async function logout() {
  const { refreshToken, clear } = useSession.getState();
  clear();
  if (refreshToken) {
    try {
      await api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
    } catch {
      /* já deslogado localmente */
    }
  }
}

// ---------- recrutador / empresa ----------
export const getRecruiter = () => api<RecruiterProfile>('/recruiters/me');
export const getCompany = (id: string) => api<Company>(`/companies/${id}`);

// ---------- vagas ----------
export const listMyJobs = () => api<Job[]>('/jobs/mine');
export const getJob = (id: string) => api<Job>(`/jobs/${id}`);
export const createJob = (input: JobInput) => api<Job>('/jobs', { method: 'POST', body: input });
export const updateJob = (id: string, input: Partial<JobInput>) => api<Job>(`/jobs/${id}`, { method: 'PATCH', body: input });
export const deactivateJob = (id: string) => api<Job>(`/jobs/${id}/deactivate`, { method: 'DELETE' });
export const getRanking = (jobId: string) => api<RankingItem[]>(`/jobs/${jobId}/ranking`);
export const unlockCandidate = (jobId: string, candidateId: string) =>
  api<UnlockResult>(`/jobs/${jobId}/candidates/${candidateId}/unlock`, { method: 'POST' });

// ---------- chats (somente leitura: o WebSocket do backend não aceita token via query) ----------
export const listChats = () => api<ChatSummary[]>('/chats');
export const getMessages = (chatId: string, cursor?: string) =>
  api<MessagesPage>(`/chats/${chatId}/messages?limit=50${cursor ? `&cursor=${cursor}` : ''}`);
