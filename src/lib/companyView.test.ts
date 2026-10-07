import { describe, expect, it } from 'vitest';
import { companyView } from './companyView';
import type { Company, Job } from '../api/jobs';

const company: Company = { id: 'co1', name: 'Nubloom', logoUrl: null, description: 'Fintech de pagamentos.', rating: 4.26 };
const job = {
  id: 'j1',
  companyId: 'co1',
  title: 'Dev Frontend',
  description: 'Interfaces rápidas.',
  salaryMin: 9000,
  salaryMax: 13000,
  modality: 'REMOTE',
  requiredSkills: ['react', 'typescript'],
} as Job;

describe('companyView', () => {
  it('monta os textos da empresa e da vaga que abriu a conversa', () => {
    const v = companyView(company, job);
    expect(v.name).toBe('Nubloom');
    expect(v.initial).toBe('n');
    expect(v.description).toBe('Fintech de pagamentos.');
    expect(v.rating).toBe('★ 4.3');
    expect(v.hasRating).toBe(true);
    expect(v.job).toEqual({
      id: 'j1',
      title: 'Dev Frontend',
      description: 'Interfaces rápidas.',
      salary: 'R$ 9k – 13k',
      modality: '100% remoto',
      skills: ['React', 'TypeScript'],
    });
  });

  it('empresa sem descrição não mostra nada no lugar', () => {
    expect(companyView({ ...company, description: '  ' }, job).description).toBeNull();
  });

  it('empresa sem nota (o backend devolve 0) diz que ainda não tem avaliações, em vez de "0.0"', () => {
    const v = companyView({ ...company, rating: 0 }, job);
    expect(v.hasRating).toBe(false);
    expect(v.rating).toBe('sem avaliações ainda');
  });

  it('enquanto empresa/vaga carregam, devolve o que tem (nome do chat como fallback)', () => {
    const v = companyView(undefined, undefined, 'Nubloom');
    expect(v.name).toBe('Nubloom');
    expect(v.job).toBeNull();
    expect(v.description).toBeNull();
  });
});
