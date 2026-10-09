import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/endpoints';
import { Wordmark } from './ui';

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
        <button className="btn ghost" onClick={onLogout}>
          sair
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
