import type { Company, Job } from '../api/jobs';
import { modalityName, skillName } from '../data/taxonomy';
import { MODALITY_LABEL, formatSalary, initialOf } from './format';

/** Tudo que a tela da empresa mostra, já em texto pt-BR — a tela só desenha. Aceita dados ainda carregando. */
export function companyView(company: Company | undefined, job: Job | undefined, fallbackName = 'empresa') {
  const name = company?.name ?? fallbackName;
  const description = company?.description?.trim();
  return {
    name,
    initial: initialOf(name),
    description: description ? description : null,
    // o backend só tem a coluna `rating` (0 por padrão; ainda não há como avaliar uma empresa)
    hasRating: !!company && company.rating > 0,
    rating: company && company.rating > 0 ? `★ ${company.rating.toFixed(1)}` : 'sem avaliações ainda',
    job: job
      ? {
          id: job.id,
          title: job.title,
          description: job.description,
          salary: formatSalary(job.salaryMin, job.salaryMax),
          modality: MODALITY_LABEL[job.modality] ?? modalityName(job.modality),
          skills: job.requiredSkills.map(skillName),
        }
      : null,
  };
}
