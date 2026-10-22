import type { CandidateMetrics } from '../api/candidates';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "63%" ou "—" enquanto não houve nenhum swipe. */
export const formatLikeRate = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

/** Rótulo do dia da semana de uma data 'YYYY-MM-DD' (calculado em UTC, igual ao backend). */
export const weekdayLabel = (date: string): string => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/** Maior total diário, base da escala das barras (mínimo 1 para nunca dividir por zero). */
export const maxDay = (days: CandidateMetrics['last7Days']): number =>
  Math.max(1, ...days.map((d) => d.likes + d.dislikes));

/** Altura (0–1) de uma parte da barra em relação ao maior dia. */
export const barRatio = (value: number, max: number): number => (max <= 0 ? 0 : Math.min(1, value / max));

/** Frase curta sobre o perfil de uso; só descreve o que os números mostram. */
export const insight = (m: CandidateMetrics): string => {
  const { total, likeRate } = m.swipes;
  if (total === 0) return 'você ainda não deu nenhum swipe. vá ao feed e curta as vagas que combinam com você.';
  if (m.companiesUnlockedYou > 0) {
    const n = m.companiesUnlockedYou;
    return `${n} ${n === 1 ? 'empresa pagou' : 'empresas pagaram'} para falar com você mesmo sem você curtir a vaga.`;
  }
  if (likeRate !== null && likeRate >= 0.6) return 'você curte a maioria das vagas que aparecem: mais chances de abrir conversas.';
  if (likeRate !== null && likeRate <= 0.2) return 'você é bem seletivo: curte poucas vagas. ajustar o raio e as skills pode trazer opções melhores.';
  return 'continue dando swipe: quanto mais você reage, mais o feed aprende o que combina com você.';
};
