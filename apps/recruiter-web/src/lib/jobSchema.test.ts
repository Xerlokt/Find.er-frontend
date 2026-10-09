import { describe, expect, it } from 'vitest';
import { jobFormSchema, toJobInput } from './jobSchema';
import { formatSalary, unlockCost } from './format';

const base = {
  title: 'Dev',
  description: 'desc',
  professionId: 'backend-dev',
  modality: 'REMOTE',
  requiredSkills: ['nodejs'],
  expiresAt: '2030-01-31',
  salaryMin: '',
  salaryMax: '',
  discProfile: '',
};

describe('jobFormSchema', () => {
  it('aceita vaga sem salário e converte para o corpo da API', () => {
    const v = jobFormSchema.parse(base);
    const body = toJobInput(v);
    expect(body).not.toHaveProperty('salaryMin');
    expect(body.discProfile).toBeNull();
    expect(new Date(body.expiresAt).getFullYear()).toBe(2030);
  });
  it('exige ao menos uma skill', () => {
    expect(jobFormSchema.safeParse({ ...base, requiredSkills: [] }).success).toBe(false);
  });
  it('rejeita salário máximo menor que o mínimo', () => {
    expect(jobFormSchema.safeParse({ ...base, salaryMin: '10', salaryMax: '5' }).success).toBe(false);
  });
  it('converte salários numéricos', () => {
    const v = jobFormSchema.parse({ ...base, salaryMin: '5000', salaryMax: '9000' });
    expect(toJobInput(v)).toMatchObject({ salaryMin: 5000, salaryMax: 9000 });
  });
});

describe('format', () => {
  it('salário', () => {
    expect(formatSalary(14000, 19000)).toBe('R$ 14k – 19k');
    expect(formatSalary(null, null)).toBe('a combinar');
  });
  it('custo de desbloqueio por plano', () => {
    expect(unlockCost('FREE')).toBe(2);
    expect(unlockCost('PRO')).toBe(1);
  });
});
