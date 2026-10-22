import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyStats } from '../../api/hooks';
import { ErrorBox } from '../../components/ui';
import { barWidth, formatRate, highlights, sortJobs, type StatsSort } from '../../lib/stats';

const SORTS: { key: StatsSort; label: string }[] = [
  { key: 'rate', label: 'taxa de like' },
  { key: 'likes', label: 'likes' },
  { key: 'views', label: 'visualizações' },
];

export function StatsTab({ companyId }: { companyId: string }) {
  const stats = useCompanyStats(companyId);
  const [sort, setSort] = useState<StatsSort>('rate');
  const data = stats.data;

  if (stats.isLoading) return <p className="muted">carregando…</p>;
  if (!data) return <ErrorBox error={stats.error} />;

  const jobs = sortJobs(data.jobs, sort);
  const maxViews = Math.max(0, ...jobs.map((j) => j.views));
  const maxReactions = Math.max(0, ...jobs.map((j) => Math.max(j.likes, j.dislikes)));
  const hl = highlights(data.jobs);
  const t = data.totals;

  return (
    <>
      <section className="card">
        <div className="stats">
          <div>
            <b>{t.jobs}</b>
            <span>vagas postadas ({t.activeJobs} ativas)</span>
          </div>
          <div>
            <b>{t.views}</b>
            <span>visualizações</span>
          </div>
          <div>
            <b>{t.likes}</b>
            <span>likes</span>
          </div>
          <div>
            <b>{t.dislikes}</b>
            <span>dislikes</span>
          </div>
        </div>
        <p className="muted small">
          visualização = a vaga apareceu no feed de um candidato (contada uma vez por candidato). Só existe a partir da
          atualização que passou a registrá-las; likes e dislikes incluem todo o histórico.
        </p>
      </section>

      {hl && (
        <p className="notice">
          mais atenção: <b>{hl.best.title}</b> ({formatRate(hl.best.likeRate)} de likes) · menos atenção:{' '}
          <b>{hl.worst.title}</b> ({formatRate(hl.worst.likeRate)} de likes)
        </p>
      )}

      {jobs.length === 0 ? (
        <p className="muted">
          você ainda não postou vagas. <Link to="/vagas">ir para vagas</Link>
        </p>
      ) : (
        <>
          <div className="chips" role="group" aria-label="ordenar vagas">
            <span className="muted small">ordenar por</span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={sort === s.key ? 'chip on' : 'chip'}
                aria-pressed={sort === s.key}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {jobs.map((j) => (
            <article key={j.jobId} className="card stat-job">
              <h3>
                <Link to={`/vagas/${j.jobId}/ranking`}>{j.title}</Link>
                <span className={j.isActive ? 'pill on' : 'pill off'}>{j.isActive ? 'ativa' : 'encerrada'}</span>
              </h3>
              <div className="bars">
                <Bar label="viram" value={j.views} width={barWidth(j.views, maxViews)} tone="views" />
                <Bar label="likes" value={j.likes} width={barWidth(j.likes, maxReactions)} tone="likes" />
                <Bar label="dislikes" value={j.dislikes} width={barWidth(j.dislikes, maxReactions)} tone="dislikes" />
              </div>
              <p className="muted small">
                taxa de like: <b>{formatRate(j.likeRate)}</b>
                {j.likeRate === null && ' (ninguém reagiu ainda)'}
              </p>
            </article>
          ))}
        </>
      )}
    </>
  );
}

function Bar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: number;
  width: number;
  tone: 'views' | 'likes' | 'dislikes';
}) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className={`bar-fill ${tone}`} style={{ width: `${width}%` }} />
      </div>
      <b className="bar-value">{value}</b>
    </div>
  );
}
