import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isCensored, unlockCandidate, type RankingItem } from '../api/endpoints';
import { keys, useCompany, useJob, useRanking } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { modalityName, professionName, skillName } from '../data/taxonomy';
import { formatDistance, formatSalary, unlockCost } from '../lib/format';
import { cardState, filterRanking, unlockRef, type RankingFilter } from '../lib/ranking';

function Card({ item, jobId, cost, credits }: { item: RankingItem; jobId: string; cost: number; credits: number | undefined }) {
  const qc = useQueryClient();
  const ref = unlockRef(item);
  const state = cardState(item, credits, cost);
  const unlock = useMutation({
    mutationFn: () => unlockCandidate(jobId, ref!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.ranking(jobId) });
      qc.invalidateQueries({ queryKey: keys.chats });
      qc.invalidateQueries({ queryKey: keys.recruiter });
      qc.invalidateQueries({ queryKey: ['company'] });
    },
  });
  const p = item.profile;
  const censored = isCensored(p);

  return (
    <article className={censored ? 'card candidate locked' : 'card candidate'}>
      <div className="score">
        <b>{Math.round(item.fitScore)}</b>
        <span>fit</span>
      </div>
      {/* placeholder genérico: o backend não manda foto nem nome de quem está censurado, o blur é só visual */}
      {censored && <div className="avatar-ph" aria-hidden="true" />}
      <div className="grow">
        <h3>
          #{item.rank} {censored ? <span className="blurred">Nome do candidato</span> : p.name}
          <span className={censored ? 'pill off' : 'pill on'}>{censored ? 'bloqueado' : 'liberado'}</span>
        </h3>
        <p className="muted">{formatDistance(item.distanceKm)}</p>
        {censored ? (
          <>
            {p.matchingSkills.length > 0 && (
              <div className="chips">
                {p.matchingSkills.map((s) => (
                  <span key={s} className="chip on">
                    {skillName(s)}
                  </span>
                ))}
              </div>
            )}
            <ul className="reasons">
              {p.fitReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
              {p.discProfile && <li>perfil DISC: {p.discProfile}</li>}
            </ul>
            {!unlock.isSuccess && (
              <>
                <button
                  className="btn primary"
                  disabled={unlock.isPending || state === 'insufficient-credits' || !ref}
                  onClick={() => window.confirm(`Desbloquear por ${cost} créditos?`) && unlock.mutate()}
                >
                  desbloquear ({cost} créditos)
                </button>
                <p className="muted small">
                  {state === 'insufficient-credits' && (
                    <>
                      saldo insuficiente ({credits} de {cost} créditos). <Link to="/creditos">comprar créditos</Link>{' '}
                    </>
                  )}
                  ou aguarde: se o candidato curtir a vaga, o perfil é liberado sem custo.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            {p.bio && <p>{p.bio}</p>}
            <p className="muted">
              {professionName(p.professionId)} · {p.preferredModalities.map(modalityName).join(', ')} · pretensão{' '}
              {formatSalary(p.salaryExpectation, p.salaryExpectation)}
            </p>
            <div className="chips">
              {p.skills.map((s) => (
                <span key={s} className="chip on">
                  {skillName(s)}
                </span>
              ))}
            </div>
          </>
        )}
        <ErrorBox error={unlock.error} />
        {unlock.isSuccess && (
          <p className="notice ok">
            candidato desbloqueado! o chat foi aberto. <Link to={`/conversas/${unlock.data.chatId}`}>abrir conversa</Link>
          </p>
        )}
      </div>
    </article>
  );
}

export function RankingPage() {
  const { id = '' } = useParams();
  const job = useJob(id);
  const ranking = useRanking(id);
  const company = useCompany(job.data?.companyId);
  const cost = unlockCost(company.data?.plan ?? 'FREE');
  const [filter, setFilter] = useState<RankingFilter>('all');
  const all = ranking.data ?? [];
  const shown = filterRanking(all, filter);
  const lockedCount = filterRanking(all, 'locked').length;
  const tabs: { key: RankingFilter; label: string; count: number }[] = [
    { key: 'all', label: 'todos', count: all.length },
    { key: 'revealed', label: 'liberados', count: all.length - lockedCount },
    { key: 'locked', label: 'censurados', count: lockedCount },
  ];

  return (
    <>
      <PageHeader title={job.data ? `candidatos · ${job.data.title}` : 'candidatos'}>
        <Link className="btn" to="/vagas">
          voltar
        </Link>
      </PageHeader>
      {company.data && (
        <p className="muted">
          saldo: <b>{company.data.credits}</b> créditos · desbloqueio custa {cost}
        </p>
      )}
      {ranking.isLoading && <p className="muted">carregando…</p>}
      <ErrorBox error={ranking.error} />
      {ranking.data?.length === 0 && (
        <p className="muted">ainda não há candidatos compatíveis com essa vaga. volte mais tarde.</p>
      )}
      {all.length > 0 && (
        <div className="chips" role="group" aria-label="filtrar candidatos">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={filter === t.key ? 'chip on' : 'chip'}
              aria-pressed={filter === t.key}
              onClick={() => setFilter(t.key)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}
      {all.length > 0 && shown.length === 0 && <p className="muted">nenhum candidato nesse filtro.</p>}
      {shown.map((it) => <Card key={it.rank} item={it} jobId={id} cost={cost} credits={company.data?.credits} />)}
    </>
  );
}
