const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Posição relativa na barra (0..1) → valor arredondado ao passo, dentro de [min, max]. */
export function valueFromRatio(ratio: number, min: number, max: number, step: number): number {
  const raw = min + Math.round((clamp01(ratio) * (max - min)) / step) * step;
  return Math.min(max, Math.max(min, raw));
}

/** Valor → posição relativa (0..1), limitada à barra. */
export function ratioFromValue(value: number, min: number, max: number): number {
  return clamp01((value - min) / (max - min));
}
