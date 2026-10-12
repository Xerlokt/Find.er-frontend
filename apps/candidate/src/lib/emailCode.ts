export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 60;

/** Mantém só dígitos (cola "123 456" ou "123-456" e funciona) e corta em 6. */
export function sanitizeCode(text: string): string {
  return text.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export const isCodeComplete = (code: string) => code.length === CODE_LENGTH;

/** Segundos que faltam para liberar o reenvio (0 = já pode). */
export function resendWait(sentAt: number, now: number): number {
  return Math.max(0, Math.ceil(RESEND_SECONDS - (now - sentAt) / 1000));
}
