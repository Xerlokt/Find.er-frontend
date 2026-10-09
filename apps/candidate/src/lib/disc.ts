import { DISC_QUESTIONS, type DiscDimension } from '../data/disc';

/** Registra uma resposta (sem mutar o array). `done` quando a última pergunta foi respondida — hora de enviar. */
export function advanceDisc(answers: DiscDimension[], pick: DiscDimension): { done: boolean; answers: DiscDimension[] } {
  const next = [...answers, pick];
  return { done: next.length >= DISC_QUESTIONS.length, answers: next };
}
