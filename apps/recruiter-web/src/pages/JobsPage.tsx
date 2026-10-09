import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateJob, type Job } from '../api/endpoints';
import { keys, useMyJobs, useRecruiter } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { professionName } from '../data/taxonomy';
import { MODALITY_LABEL, formatDate, formatSalary } from '../lib/format';

function status(job: Job) {
  if (!job.isActive) return { label: 'encerrada', cls: 'off' };
  if (new Date(job.expiresAt) < new Date()) return { label: 'expirada', cls: 'off' };
  return { label: 'ativa', cls: 'on' };
}

function JobRow({ job }: { job: Job }) {
  const qc = useQueryClient();
  const close = useMutation({
    mutationFn: () => deactivateJob(job.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.jobs }),
  });
  const st = status(job);
  return (
    <article className="card job-row">
      <div className="grow">
        <h3>
          {job.title} <span className={`pill ${st.cls}`}>{st.label}</span>
        </h3>
        <p className="muted">
          {professionName(job.professionId)} · {MODALITY_LABEL[job.modality]} · {formatSalary(job.salaryMin, job.salaryMax)} ·
          expira {formatDate(job.expiresAt)}
        </p>
        <ErrorBox error={close.error} />
      </div>
      <div className="row">
        <Link className="btn primary" to={`/vagas/${job.id}/ranking`}>
          candidatos
        </Link>
        <Link className="btn" to={`/vagas/${job.id}/editar`}>
          editar
        </Link>
        {job.isActive && (
          <button
            className="btn danger"
            disabled={close.isPending}
            onClick={() => window.confirm('Encerrar a vaga? Não dá pra reabrir depois.') && close.mutate()}
          >
            encerrar
          </button>
        )}
      </div>
    </article>
  );
}

export function JobsPage() {
  const recruiter = useRecruiter();
  const jobs = useMyJobs();
  const noCompany = recruiter.isSuccess && recruiter.data === null;

  return (
    <>
      <PageHeader title="minhas vagas">
        <Link className="btn primary" to="/vagas/nova">
          nova vaga
        </Link>
      </PageHeader>
      {noCompany && (
        <p className="notice">
          essa conta não está vinculada a uma empresa. <Link to="/empresa">saiba mais</Link>
        </p>
      )}
      {jobs.isLoading && <p className="muted">carregando…</p>}
      <ErrorBox error={jobs.error} />
      {jobs.data?.length === 0 && <p className="muted">nenhuma vaga ainda. crie a primeira!</p>}
      {jobs.data?.map((j) => <JobRow key={j.id} job={j} />)}
    </>
  );
}
