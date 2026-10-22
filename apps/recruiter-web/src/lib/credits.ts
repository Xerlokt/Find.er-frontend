export const formatPrice = (cents: number): string =>
  `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pricePerCredit = (pkg: { credits: number; priceCents: number }): string =>
  formatPrice(Math.round(pkg.priceCents / pkg.credits));

/** Saldo abaixo do custo de um desbloqueio. Saldo ainda carregando (undefined) não alarma. */
export const isLowBalance = (credits: number | undefined, cost: number): boolean =>
  credits !== undefined && credits < cost;

const PACKAGE_NAMES: Record<string, string> = { starter: 'Inicial', pro: 'Profissional', scale: 'Escala' };
export const packageName = (id: string): string => PACKAGE_NAMES[id] ?? id;

/** Rótulo do motivo de uma transação do extrato (backend: CreditTransaction.reason). */
export const transactionLabel = (reason: string): string => {
  if (reason.startsWith('purchase:')) return `Compra · pacote ${packageName(reason.slice('purchase:'.length))}`;
  if (reason === 'candidate_unlock') return 'Desbloqueio de candidato';
  if (reason === 'admin_grant') return 'Crédito concedido pela plataforma';
  return reason;
};
