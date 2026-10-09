import { colors } from '../theme';
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

/** "agora", "há 5min", "há 2h", "há 3d", "há 2sem" */
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

/** Distância em km (haversine) */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1 ? 'a menos de 1 km' : `a ${Math.round(km)} km`;
}

const BRANDS = [colors.accent, colors.primary, colors.ink, colors.success, colors.streak];

/** Cor estável por empresa: o backend não manda cor/foto, então derivamos do id. */
export function brandColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BRANDS[h % BRANDS.length];
}

export const initialOf = (name?: string) => (name?.trim()[0] ?? '?').toLowerCase();
