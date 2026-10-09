// O backend não expõe a taxonomia; estes ids espelham seedTaxonomy() em
// Backend_Find.er/src/adapters/services/recommendation.repository.ts. Ids desconhecidos pontuam 0 no fit score.
export type Option = { id: string; name: string };

export const PROFESSIONS: Option[] = [
  { id: 'backend-dev', name: 'Backend' },
  { id: 'frontend-dev', name: 'Frontend' },
  { id: 'fullstack-dev', name: 'Fullstack' },
  { id: 'devops', name: 'DevOps' },
  { id: 'data-scientist', name: 'Data Science' },
  { id: 'mobile-dev', name: 'Mobile' },
];

export const SKILLS: Option[] = [
  { id: 'nodejs', name: 'Node.js' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'react', name: 'React' },
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'docker', name: 'Docker' },
  { id: 'python', name: 'Python' },
  { id: 'go', name: 'Go' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'swift', name: 'Swift' },
  { id: 'sql', name: 'SQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'java', name: 'Java' },
  { id: 'spring', name: 'Spring' },
  { id: 'rust', name: 'Rust' },
  { id: 'django', name: 'Django' },
  { id: 'fastapi', name: 'FastAPI' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'angular', name: 'Angular' },
  { id: 'css', name: 'CSS' },
  { id: 'sass', name: 'Sass' },
  { id: 'tailwind', name: 'Tailwind CSS' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'kubernetes', name: 'Kubernetes' },
  { id: 'devops', name: 'DevOps' },
  { id: 'aws', name: 'AWS' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'terraform', name: 'Terraform' },
  { id: 'iac', name: 'IaC' },
  { id: 'github-actions', name: 'GitHub Actions' },
  { id: 'ci-cd', name: 'CI/CD' },
  { id: 'ios', name: 'iOS' },
  { id: 'android', name: 'Android' },
  { id: 'react-native', name: 'React Native' },
  { id: 'flutter', name: 'Flutter' },
  { id: 'dart', name: 'Dart' },
];

export type Modality = 'REMOTE' | 'HYBRID' | 'IN_PERSON';

export const MODALITIES: { id: Modality; name: string }[] = [
  { id: 'REMOTE', name: 'Remoto' },
  { id: 'HYBRID', name: 'Híbrido' },
  { id: 'IN_PERSON', name: 'Presencial' },
];

export const professionName = (id: string) => PROFESSIONS.find((p) => p.id === id)?.name ?? id;
export const skillName = (id: string) => SKILLS.find((s) => s.id === id)?.name ?? id;
export const modalityName = (id: string) => MODALITIES.find((m) => m.id === id)?.name ?? id;
