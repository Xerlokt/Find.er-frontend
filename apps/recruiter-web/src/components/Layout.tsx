import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/endpoints';
import { useMyCompany } from '../api/hooks';
import { isLowBalance } from '../lib/credits';
import { unlockCost } from '../lib/format';
import { Wordmark } from './ui';

/** Saldo de créditos sempre à vista; clicar leva à tela de compra. */
function CreditChip() {
  const company = useMyCompany();
  const credits = company.data?.credits;
  const low = isLowBalance(credits, unlockCost(company.data?.plan ?? 'FREE'));
  return (
    <Link
      to="/creditos"
      className={low ? 'credit-chip low' : 'credit-chip'}
      title={low ? 'saldo baixo: comprar créditos' : 'comprar mais créditos'}
    >
      <span aria-hidden="true">◆</span>
      <b>{credits ?? '—'}</b>
      <span>créditos</span>
      <span className="plus" aria-hidden="true">
        +
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const onLogout = async () => {
    await logout();
    qc.clear();
    navigate('/login');
  };
  return (
    <div className="shell">
      <header className="topbar">
        <Wordmark small />
        <nav>
          <NavLink to="/vagas">vagas</NavLink>
          <NavLink to="/conversas">conversas</NavLink>
          <NavLink to="/empresa">empresa</NavLink>
        </nav>
        <CreditChip />
        <button className="btn ghost" onClick={onLogout}>
          sair
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
