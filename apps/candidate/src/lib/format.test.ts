import { describe, expect, it } from 'vitest';
import { brandColor, distanceKm, formatDistance, formatSalary, timeAgo } from './format';

describe('format', () => {
  it('formatSalary cobre faixa, mínimo, máximo e vazio', () => {
    expect(formatSalary(14000, 19000)).toBe('R$ 14k – 19k');
    expect(formatSalary(14500, 19000)).toBe('R$ 14.5k – 19k');
    expect(formatSalary(14000, null)).toBe('a partir de R$ 14k');
    expect(formatSalary(null, 9000)).toBe('até R$ 9k');
    expect(formatSalary(null, null)).toBe('a combinar');
    expect(formatSalary(900, 900)).toBe('R$ 900');
  });

  it('timeAgo', () => {
    const now = new Date('2026-10-03T12:00:00Z').getTime();
    expect(timeAgo('2026-10-03T11:59:40Z', now)).toBe('agora');
    expect(timeAgo('2026-10-03T11:30:00Z', now)).toBe('há 30min');
    expect(timeAgo('2026-10-03T10:00:00Z', now)).toBe('há 2h');
    expect(timeAgo('2026-09-30T12:00:00Z', now)).toBe('há 3d');
    expect(timeAgo('2026-09-12T12:00:00Z', now)).toBe('há 3sem');
  });

  it('distanceKm: São Paulo → Rio ≈ 360 km', () => {
    const d = distanceKm({ lat: -23.55, lng: -46.63 }, { lat: -22.91, lng: -43.17 });
    expect(d).toBeGreaterThan(350);
    expect(d).toBeLessThan(370);
    expect(formatDistance(0.4)).toBe('a menos de 1 km');
    expect(formatDistance(12.4)).toBe('a 12 km');
  });

  it('brandColor é estável', () => {
    expect(brandColor('abc')).toBe(brandColor('abc'));
  });
});
