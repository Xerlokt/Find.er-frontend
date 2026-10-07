export const RADIUS_MIN_KM = 5;
export const RADIUS_MAX_KM = 200; // no slider significa "200 km ou mais"
export const RADIUS_STEP_KM = 5;
export const RADIUS_DEFAULT_KM = 50;
// O backend só aceita inteiro positivo e o raio entra em `1 - dist/raio`: um valor enorme faz a distância não pesar.
export const RADIUS_UNLIMITED_KM = 20000;

export function radiusToPayload(sliderKm: number): number {
  return sliderKm >= RADIUS_MAX_KM ? RADIUS_UNLIMITED_KM : sliderKm;
}

export function radiusFromSaved(savedKm: number | null | undefined): number {
  if (!savedKm || savedKm <= 0) return RADIUS_DEFAULT_KM;
  return Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, savedKm));
}
