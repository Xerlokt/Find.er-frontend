import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useSession } from './store/session';
import { refreshSession } from './api/client';
import { Layout } from './components/Layout';
import { Splash } from './components/ui';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CompanyPage } from './pages/CompanyPage';
import { JobsPage } from './pages/JobsPage';
import { JobFormPage } from './pages/JobFormPage';
import { RankingPage } from './pages/RankingPage';
import { ChatsPage } from './pages/ChatsPage';

/** Restaura a sessão (refresh token em localStorage -> novo access token) antes de decidir a rota. */
function useBootstrap() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = useSession.getState();
    s.hydrate();
    (async () => {
      if (useSession.getState().refreshToken) await refreshSession();
      setReady(true);
    })();
  }, []);
  return ready;
}

function Protected() {
  const { accessToken, role } = useSession();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (role !== 'RECRUITER') {
    return (
      <Splash
        title="esse site é pra recrutadores"
        text="sua conta não é de recrutador. candidatos usam o app mobile do find.er."
        action={{ label: 'sair', onClick: () => useSession.getState().clear() }}
      />
    );
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function PublicOnly() {
  const accessToken = useSession((s) => s.accessToken);
  return accessToken ? <Navigate to="/vagas" replace /> : <Outlet />;
}

export function App() {
  const ready = useBootstrap();
  if (!ready) return <Splash title="carregando…" />;
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>
      <Route element={<Protected />}>
        <Route path="/vagas" element={<JobsPage />} />
        <Route path="/vagas/nova" element={<JobFormPage />} />
        <Route path="/vagas/:id/editar" element={<JobFormPage />} />
        <Route path="/vagas/:id/ranking" element={<RankingPage />} />
        <Route path="/empresa" element={<CompanyPage />} />
        <Route path="/conversas" element={<ChatsPage />} />
        <Route path="/conversas/:chatId" element={<ChatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/vagas" replace />} />
    </Routes>
  );
}
