import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDisc, getMyProfile, saveMyProfile, submitDisc, type ProfileInput } from './candidates';
import type { DiscDimension } from '../data/disc';

export const keys = {
  profile: ['candidate', 'me'] as const,
  disc: (profileId: string) => ['candidate', 'disc', profileId] as const,
};

export const useProfile = (enabled = true) =>
  useQuery({ queryKey: keys.profile, queryFn: getMyProfile, enabled });

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => saveMyProfile(input),
    onSuccess: (profile) => {
      qc.setQueryData(keys.profile, profile);
      // o perfil muda o ranking do feed (cache de 60s no backend é invalidado lá; aqui descartamos o nosso)
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export const useDisc = (profileId: string | undefined) =>
  useQuery({
    queryKey: keys.disc(profileId ?? ''),
    queryFn: () => getDisc(profileId!),
    enabled: !!profileId,
  });

export function useSubmitDisc(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: DiscDimension[]) => submitDisc(profileId, answers),
    onSuccess: ({ dominant }) => qc.setQueryData(keys.disc(profileId), dominant),
  });
}
