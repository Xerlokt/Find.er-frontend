import { ApiError, friendlyMessage } from '../api/errors';
import type { SwipeDirection } from '../api/jobs';

export const swipeDirection = (dir: 'left' | 'right'): SwipeDirection => (dir === 'right' ? 'LIKE' : 'DISLIKE');

/**
 * O que fazer quando o POST /swipes falha.
 * 409 DUPLICATE_SWIPE: já foi swipada em outro lugar, some do deck em silêncio.
 * Qualquer outra falha: a vaga volta ao deck e o usuário é avisado.
 */
export function swipeFailure(e: unknown): { restore: boolean; notice: string | null } {
  if (e instanceof ApiError && e.code === 'DUPLICATE_SWIPE') return { restore: false, notice: null };
  return { restore: true, notice: friendlyMessage(e) };
}
