import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isCensored, unlockCandidate, type RankingItem } from '../api/endpoints';
import { keys, useCompany, useJob, useRanking } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { modalityName, professionName, skillName } from '../data/taxonomy';
import { formatDistance, formatSalary, unlockCost } from '../lib/format';

function Card({ item, jobId, cost }: { item: RankingItem; jobId: string; cost: number }) {
  const qc = useQueryClient();
  const unlock = useMutation({
    mutationFn: () => unlockCandidate(jobId, item.candidateId!),
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
    <article className="card candidate">
      <div className="score">
        <b>{Math.round(item.fitScore)}</b>
        <span>fit</span>
      </div>
      <div className="grow">
        <h3>
          #{item.rank} {censored ? 'candidato anônimo' : p.name}
          <span className={censored ? 'pill off' : 'pill on'}>{censored ? 'não curtiu' : 'curtiu a vaga'}</span>
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
            {!item.candidateId ? (
              // lacuna do backend: o ranking omite candidateId de quem não curtiu, então não dá pra chamar /unlock
              <p className="notice">desbloqueio indisponível: a API não envia o id de candidatos que não curtiram a vaga.</p>
            ) : (
              <button
                className="btn primary"
                disabled={unlock.isPending}
                onClick={() => window.confirm(`Desbloquear por ${cost} créditos?`) && unlock.mutate()}
              >
                desbloquear ({cost} créditos)
              </button>
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
        <p className="muted">ninguém deu swipe nessa vaga ainda. candidatos aparecem aqui depois de curtir ou dispensar.</p>
      )}
      {ranking.data?.map((it) => <Card key={it.rank} item={it} jobId={id} cost={cost} />)}
    </>
  );
}
