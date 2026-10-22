import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecruiter, useCompany } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { formatCnpj } from '../lib/cnpj';
import { unlockCost } from '../lib/format';
import { PhotosTab } from './company/PhotosTab';
import { ProfileTab } from './company/ProfileTab';
import { StatsTab } from './company/StatsTab';

type Tab = 'perfil' | 'fotos' | 'estatisticas';
const TABS: { key: Tab; label: string }[] = [
  { key: 'perfil', label: 'perfil' },
  { key: 'fotos', label: 'fotos' },
  { key: 'estatisticas', label: 'estatísticas' },
];

export function CompanyPage() {
  const [tab, setTab] = useState<Tab>('perfil');
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
        <div className="chips" role="tablist" aria-label="seções da empresa">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'chip on' : 'chip'}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {c && tab === 'perfil' && <ProfileTab key={c.id} company={c} />}
      {c && tab === 'fotos' && <PhotosTab company={c} />}
      {c && tab === 'estatisticas' && <StatsTab companyId={c.id} />}

      {c && tab === 'perfil' && (
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
          <p>
            <Link className="btn primary" to="/creditos">
              comprar créditos
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
