import { z } from 'zod';

const optionalNumber = z.preprocess(
  (v) => (v === '' || v == null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v),
  z.coerce.number().positive('valor deve ser maior que 0').optional(),
);

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(1, 'informe o título').max(200),
    description: z.string().trim().min(1, 'informe a descrição').max(5000),
    professionId: z.string().min(1, 'escolha a profissão'),
    modality: z.enum(['REMOTE', 'HYBRID', 'IN_PERSON']),
    requiredSkills: z.array(z.string()).min(1, 'escolha ao menos uma skill'),
    expiresAt: z.string().min(1, 'informe a data de expiração'),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    discProfile: z.enum(['', 'D', 'I', 'S', 'C']),
  })
  .refine((v) => v.salaryMin == null || v.salaryMax == null || v.salaryMin <= v.salaryMax, {
    path: ['salaryMax'],
    message: 'máximo deve ser maior ou igual ao mínimo',
  });

export type JobFormOutput = z.output<typeof jobFormSchema>;

/** Converte o formulário no corpo esperado por POST/PATCH /jobs (expiresAt em ISO). */
export function toJobInput(v: JobFormOutput) {
  return {
    title: v.title,
    description: v.description,
    professionId: v.professionId,
    modality: v.modality,
    requiredSkills: v.requiredSkills,
    expiresAt: new Date(`${v.expiresAt}T23:59:59`).toISOString(),
    ...(v.salaryMin != null ? { salaryMin: v.salaryMin } : {}),
    ...(v.salaryMax != null ? { salaryMax: v.salaryMax } : {}),
    discProfile: v.discProfile === '' ? null : v.discProfile,
  };
}
