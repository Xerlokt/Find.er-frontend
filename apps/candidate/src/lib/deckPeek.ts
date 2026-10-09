/** Animação de "espiar o deck" ao abrir o app: as cartas abrem em leque por um instante e voltam para a pilha. */

export type PeekPose = { x: number; y: number; rotate: number };

const LIFT = -16; // a carta do topo sobe um pouco
const SPREAD_X = 26; // quanto cada nível de profundidade desliza para a esquerda
const SPREAD_ROTATE = 6; // e quantos graus gira (anti-horário)

/**
 * Posição de uma carta no leque. `progress` vai de 0 (pilha normal) a 1 (leque aberto).
 * Topo: só sobe. As de baixo abrem para a esquerda, cada uma mais que a anterior.
 * Roda no thread de UI (worklet) dentro do estilo animado.
 */
export function peekPose(depth: number, progress: number): PeekPose {
  'worklet';
  const p = Math.min(1, Math.max(0, progress));
  if (depth === 0) return { x: 0, y: 0 + LIFT * p, rotate: 0 }; // `0 +` evita -0 quando p = 0
  return { x: 0 - SPREAD_X * depth * p, y: 0, rotate: 0 - SPREAD_ROTATE * depth * p };
}

let played = false;

/** Verdadeiro só uma vez por abertura do app, e só se houver pelo menos 2 cartas para abrir em leque. */
export function consumeDeckIntro(cardCount: number): boolean {
  if (played || cardCount < 2) return false;
  played = true;
  return true;
}

export function resetDeckIntro() {
  played = false;
}
