import { useQuery } from '@tanstack/react-query';
import { ApiError } from './errors';
import { getCompany, getRecruiter, getRanking, listChats, listMyJobs, getJob, getMessages } from './endpoints';

export const keys = {
  recruiter: ['recruiter'] as const,
  company: (id: string) => ['company', id] as const,
  jobs: ['jobs'] as const,
  job: (id: string) => ['job', id] as const,
  ranking: (id: string) => ['ranking', id] as const,
  chats: ['chats'] as const,
  messages: (id: string) => ['messages', id] as const,
};

/** 404 = recrutador ainda não vinculou empresa (data = null). */
export const useRecruiter = () =>
  useQuery({
    queryKey: keys.recruiter,
    queryFn: async () => {
      try {
        return await getRecruiter();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

export const useCompany = (id?: string) =>
  useQuery({ queryKey: keys.company(id ?? ''), queryFn: () => getCompany(id!), enabled: !!id });

export const useMyJobs = () => useQuery({ queryKey: keys.jobs, queryFn: listMyJobs });
export const useJob = (id?: string) => useQuery({ queryKey: keys.job(id ?? ''), queryFn: () => getJob(id!), enabled: !!id });
export const useRanking = (jobId: string) => useQuery({ queryKey: keys.ranking(jobId), queryFn: () => getRanking(jobId) });
export const useChats = () => useQuery({ queryKey: keys.chats, queryFn: listChats });
export const useMessages = (chatId?: string) =>
  useQuery({ queryKey: keys.messages(chatId ?? ''), queryFn: () => getMessages(chatId!), enabled: !!chatId });
