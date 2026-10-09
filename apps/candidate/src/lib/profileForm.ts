import { z } from 'zod';
import type { CandidateProfile, ProfileInput } from '../api/candidates';
import { radiusFromSaved, radiusToPayload } from './radius';

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'como a gente te chama?').max(100, 'máximo 100 caracteres'),
  bio: z.string().max(500, 'máximo 500 caracteres'),
  professionId: z.string().min(1, 'escolhe sua área'),
  skills: z.array(z.string()).min(1, 'escolhe ao menos 1 skill'),
  preferredModalities: z.array(z.enum(['REMOTE', 'HYBRID', 'IN_PERSON'])).min(1, 'escolhe ao menos 1 modalidade'),
  salary: z.string().refine((v) => v.trim() === '' || Number(v.replace(',', '.')) > 0, 'valor inválido'),
  radius: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'use um número inteiro maior que 0'),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export function profileDefaults(initial?: CandidateProfile | null): ProfileFormValues {
  return {
    name: initial?.name ?? '',
    bio: initial?.bio ?? '',
    professionId: initial?.professionId ?? '',
    skills: initial?.skills ?? [],
    preferredModalities: initial?.preferredModalities ?? [],
    salary: initial?.salaryExpectation != null ? String(initial.salaryExpectation) : '',
    radius: String(radiusFromSaved(initial?.searchRadiusKm)),
  };
}

export function buildProfileInput(v: ProfileFormValues, coords: { lat: number; lng: number } | null): ProfileInput {
  const salary = v.salary.trim() === '' ? undefined : Number(v.salary.replace(',', '.'));
  return {
    name: v.name,
    ...(v.bio.trim() ? { bio: v.bio.trim() } : {}),
    ...(coords ?? {}),
    professionId: v.professionId,
    skills: v.skills,
    preferredModalities: v.preferredModalities,
    ...(salary !== undefined ? { salaryExpectation: salary } : {}),
    searchRadiusKm: radiusToPayload(Number(v.radius)),
  };
}
