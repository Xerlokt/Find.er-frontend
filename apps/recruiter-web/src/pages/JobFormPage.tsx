import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob, updateJob } from '../api/endpoints';
import { keys, useJob } from '../api/hooks';
import { ErrorBox, Field, PageHeader } from '../components/ui';
import { MODALITIES, PROFESSIONS, SKILLS } from '../data/taxonomy';
import { jobFormSchema, toJobInput, type JobFormOutput } from '../lib/jobSchema';

type FormValues = {
  title: string;
  description: string;
  professionId: string;
  modality: 'REMOTE' | 'HYBRID' | 'IN_PERSON';
  requiredSkills: string[];
  expiresAt: string;
  salaryMin: string;
  salaryMax: string;
  discProfile: '' | 'D' | 'I' | 'S' | 'C';
};

const tomorrow = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

export function JobFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const job = useJob(id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, JobFormOutput>({
    // salaryMin/Max passam por z.preprocess (entrada `unknown`), então o tipo do resolver precisa de cast
    resolver: zodResolver(jobFormSchema) as unknown as Resolver<FormValues, unknown, JobFormOutput>,
    defaultValues: {
      title: '',
      description: '',
      professionId: '',
      modality: 'REMOTE',
      requiredSkills: [],
      expiresAt: tomorrow(),
      salaryMin: '',
      salaryMax: '',
      discProfile: '',
    },
  });

  useEffect(() => {
    const j = job.data;
    if (!j) return;
    reset({
      title: j.title,
      description: j.description,
      professionId: j.professionId,
      modality: j.modality,
      requiredSkills: j.requiredSkills,
      expiresAt: j.expiresAt.slice(0, 10),
      salaryMin: j.salaryMin?.toString() ?? '',
      salaryMax: j.salaryMax?.toString() ?? '',
      discProfile: j.discProfile ?? '',
    });
  }, [job.data, reset]);

  const save = useMutation({
    mutationFn: (v: JobFormOutput) => (editing ? updateJob(id!, toJobInput(v)) : createJob(toJobInput(v))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.jobs });
      if (id) qc.invalidateQueries({ queryKey: keys.job(id) });
      navigate('/vagas');
    },
  });

  return (
    <>
      <PageHeader title={editing ? 'editar vaga' : 'nova vaga'} />
      <form className="card form-grid" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
        <Field label="título" error={errors.title?.message}>
          <input {...register('title')} />
        </Field>
        <Field label="descrição" error={errors.description?.message}>
          <textarea rows={6} {...register('description')} />
        </Field>
        <div className="two-col">
          <Field label="profissão" error={errors.professionId?.message}>
            <select {...register('professionId')}>
              <option value="">escolha…</option>
              {PROFESSIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="modalidade" error={errors.modality?.message}>
            <select {...register('modality')}>
              {MODALITIES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="skills exigidas" error={errors.requiredSkills?.message}>
          <Controller
            control={control}
            name="requiredSkills"
            render={({ field }) => (
              <div className="chips">
                {SKILLS.map((s) => {
                  const on = field.value.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={on ? 'chip on' : 'chip'}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== s.id) : [...field.value, s.id])}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>
        <div className="two-col">
          <Field label="salário mínimo (R$)" error={errors.salaryMin?.message}>
            <input type="number" min={0} {...register('salaryMin')} />
          </Field>
          <Field label="salário máximo (R$)" error={errors.salaryMax?.message}>
            <input type="number" min={0} {...register('salaryMax')} />
          </Field>
        </div>
        <div className="two-col">
          <Field label="expira em" error={errors.expiresAt?.message}>
            <input type="date" {...register('expiresAt')} />
          </Field>
          <Field label="perfil DISC desejado (opcional)">
            <select {...register('discProfile')}>
              <option value="">indiferente</option>
              <option value="D">D — dominante</option>
              <option value="I">I — influente</option>
              <option value="S">S — estável</option>
              <option value="C">C — consciente</option>
            </select>
          </Field>
        </div>
        <ErrorBox error={save.error} />
        <div className="row">
          <button className="btn primary" disabled={save.isPending}>
            {save.isPending ? 'salvando…' : 'salvar vaga'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/vagas')}>
            cancelar
          </button>
        </div>
      </form>
    </>
  );
}
