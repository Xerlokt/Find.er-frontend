import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { purchaseCredits, type CreditPackage } from '../api/endpoints';
import { keys, useCreditPackages, useMyCompany, useMyTransactions } from '../api/hooks';
import { ErrorBox, PageHeader } from '../components/ui';
import { formatPrice, isLowBalance, packageName, pricePerCredit, transactionLabel } from '../lib/credits';
import { unlockCost } from '../lib/format';

export function CreditsPage() {
  const qc = useQueryClient();
  const company = useMyCompany();
  const packages = useCreditPackages();
  const transactions = useMyTransactions();
  const cost = unlockCost(company.data?.plan ?? 'FREE');
  const credits = company.data?.credits;
  const low = isLowBalance(credits, cost);

  const buy = useMutation({
    mutationFn: (pkg: CreditPackage) => purchaseCredits(pkg.id),
    onSuccess: () => {
      // o chip da navbar, o ranking e a página da empresa leem esta mesma query
      qc.invalidateQueries({ queryKey: ['company'] });
      qc.invalidateQueries({ queryKey: keys.recruiter });
      qc.invalidateQueries({ queryKey: keys.transactions });
    },
  });

  const onBuy = (pkg: CreditPackage) => {
    const ok = window.confirm(
      `Comprar o pacote ${packageName(pkg.id)}: ${pkg.credits} créditos por ${formatPrice(pkg.priceCents)}?\n\n(pagamento simulado, ambiente de teste)`,
    );
    if (ok) buy.mutate(pkg);
  };

  return (
    <>
      <PageHeader title="créditos">
        <Link className="btn" to="/vagas">
          voltar
        </Link>
      </PageHeader>

      <p className="notice">
        pagamento <b>simulado</b> (ambiente de teste): a compra é aprovada na hora e os créditos entram direto no saldo.
      </p>

      <section className="card">
        <div className="stats">
          <div>
            <b>{credits ?? '—'}</b>
            <span>créditos no saldo</span>
          </div>
          <div>
            <b>{cost}</b>
            <span>créditos por desbloqueio</span>
          </div>
          <div>
            <b>{credits === undefined ? '—' : Math.floor(credits / cost)}</b>
            <span>desbloqueios possíveis</span>
          </div>
        </div>
        {low && <p className="notice warn">saldo insuficiente para desbloquear um candidato. escolha um pacote abaixo.</p>}
      </section>

      <h2>pacotes</h2>
      <ErrorBox error={packages.error} />
      {packages.isLoading && <p className="muted">carregando…</p>}
      <div className="packages">
        {packages.data?.map((pkg, i) => (
          <article key={pkg.id} className={i === 1 ? 'card package featured' : 'card package'}>
            {i === 1 && <span className="pill on">mais escolhido</span>}
            <h3>{packageName(pkg.id)}</h3>
            <p className="package-credits">
              <b>{pkg.credits}</b> créditos
            </p>
            <p className="package-price">{formatPrice(pkg.priceCents)}</p>
            <p className="muted small">
              {pricePerCredit(pkg)} por crédito · {Math.floor(pkg.credits / cost)} desbloqueios
            </p>
            <button className="btn primary" disabled={buy.isPending} onClick={() => onBuy(pkg)}>
              {buy.isPending && buy.variables?.id === pkg.id ? 'comprando…' : 'comprar'}
            </button>
          </article>
        ))}
      </div>
      <ErrorBox error={buy.error} />
      {buy.isSuccess && (
        <p className="notice ok">
          compra aprovada! +{buy.data.credits} créditos. novo saldo: <b>{buy.data.balance}</b>.{' '}
          <Link to="/vagas">ver minhas vagas</Link>
        </p>
      )}

      <h2>extrato</h2>
      <ErrorBox error={transactions.error} />
      {transactions.data?.length === 0 && <p className="muted">nenhuma movimentação ainda.</p>}
      {transactions.data && transactions.data.length > 0 && (
        <section className="card">
          <ul className="ledger">
            {transactions.data.map((t) => (
              <li key={t.id}>
                <span className="grow">
                  {transactionLabel(t.reason)}
                  <small className="muted"> · {new Date(t.createdAt).toLocaleString('pt-BR')}</small>
                </span>
                <b className={t.amount > 0 ? 'plus' : 'minus'}>{t.amount > 0 ? `+${t.amount}` : t.amount}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
