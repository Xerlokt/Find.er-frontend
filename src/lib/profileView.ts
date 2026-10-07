import type { CandidateProfile } from '../api/candidates';
import { DISC_LABELS, type DiscDimension } from '../data/disc';
import { modalityName, professionName, skillName } from '../data/taxonomy';
import { formatSalary, initialOf } from './format';
import { RADIUS_MAX_KM } from './radius';

/** Tudo que a aba Perfil mostra, já em texto pt-BR — a tela só desenha. */
export function profileView(p: CandidateProfile, disc: DiscDimension | null) {
  const bio = p.bio?.trim();
  return {
    name: p.name,
    initial: initialOf(p.name),
    professionLabel: professionName(p.professionId),
    bio: bio ? bio : null,
    skills: p.skills.map(skillName),
    modalities: p.preferredModalities.map(modalityName),
    salary: p.salaryExpectation != null ? formatSalary(p.salaryExpectation, p.salaryExpectation) : 'não informado',
    radius: p.searchRadiusKm >= RADIUS_MAX_KM ? `${RADIUS_MAX_KM}+ km` : `${p.searchRadiusKm} km`,
    hasLocation: p.lat != null && p.lng != null,
    disc: disc ? { letter: disc, ...DISC_LABELS[disc] } : null,
    discActionLabel: disc ? 'refazer o teste DISC' : 'fazer o teste DISC',
  };
}
