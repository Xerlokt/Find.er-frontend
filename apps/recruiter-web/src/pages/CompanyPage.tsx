import { useRecruiter, useCompany } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { formatCnpj } from '../lib/cnpj';
import { unlockCost } from '../lib/format';

export function CompanyPage() {
  const recruiter = useRecruiter();
  const company = useCompany(recruiter.data?.companyId);
  const c = company.data;

  return (
    <>
      <PageHeader title="empresa" />
      {recruiter.isLoading && <p className="muted">carregando…</p>}
      <ErrorBox error={recruiter.error ?? company.error} />

      {recruiter.isSuccess && recruiter.data === null && (
        <p className="notice">
          essa conta não está vinculada a nenhuma empresa (conta antiga). cadastre sua empresa com o CNPJ numa nova conta.
        </p>
      )}

      {c && (
        <section className="card">
          <h2>{c.tradeName ?? c.name}</h2>
          <dl className="facts">
            {c.legalName && (
              <>
                <dt>razão social</dt>
                <dd>{c.legalName}</dd>
              </>
            )}
            {c.cnpj && (
              <>
                <dt>CNPJ</dt>
                <dd>{formatCnpj(c.cnpj)}</dd>
              </>
            )}
            {(c.city || c.state) && (
              <>
                <dt>localização</dt>
                <dd>{[c.city, c.state].filter(Boolean).join(' / ')}</dd>
              </>
            )}
          </dl>
          {c.description && <p>{c.description}</p>}
          <div className="stats">
            <div>
              <b>{c.credits}</b>
              <span>créditos</span>
            </div>
            <div>
              <b>{c.plan}</b>
              <span>plano</span>
            </div>
            <div>
              <b>{unlockCost(c.plan)}</b>
              <span>créditos por desbloqueio</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
