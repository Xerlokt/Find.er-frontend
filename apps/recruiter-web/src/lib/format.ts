import type { Modality } from '../data/taxonomy';

const k = (n: number) => (n >= 1000 ? `${Number((n / 1000).toFixed(1))}k` : String(Math.round(n)));

/** "R$ 14k – 19k", "a partir de R$ 14k", "até R$ 19k" ou "a combinar" */
export function formatSalary(min: number | null, max: number | null): string {
  if (min != null && max != null) return min === max ? `R$ ${k(min)}` : `R$ ${k(min)} – ${k(max)}`;
  if (min != null) return `a partir de R$ ${k(min)}`;
  if (max != null) return `até R$ ${k(max)}`;
  return 'a combinar';
}

export const MODALITY_LABEL: Record<Modality, string> = {
  REMOTE: '100% remoto',
  HYBRID: 'Híbrido',
  IN_PERSON: 'Presencial',
};

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return `há ${Math.floor(d / 7)}sem`;
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export const formatDistance = (km: number | null) =>
  km == null ? '—' : km < 1 ? 'a menos de 1 km' : `a ${Math.round(km)} km`;

/** Custo de um desbloqueio: 2 créditos no plano FREE, 1 no PRO (backend: credits.constants.ts). */
export const unlockCost = (plan: string) => (plan === 'PRO' ? 1 : 2);
