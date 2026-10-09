import { API_URL } from '../config';

export type FieldIssue = { field: string; message: string };

/** Erro normalizado: cobre {error, code}, Zod {error, details[]}, 429 {retryAfter} e falhas de rede. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: FieldIssue[],
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetwork() {
    return this.status === 0;
  }
}

export function parseApiError(status: number, body: unknown): ApiError {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const message = typeof b.error === 'string' ? b.error : typeof b.message === 'string' ? b.message : 'Erro inesperado';
  const code = typeof b.code === 'string' ? b.code : undefined;
  const details = Array.isArray(b.details) ? (b.details as FieldIssue[]) : undefined;
  const retryAfter = typeof b.retryAfter === 'number' ? b.retryAfter : undefined;
  return new ApiError(status, message, code, details, retryAfter);
}

/** Texto amigável em pt-BR para exibir ao usuário. */
export function friendlyMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'algo deu errado, tenta de novo 💜';
  if (err.isNetwork) {
    const base = 'não consegui falar com o servidor. confere a internet e tenta de novo';
    // em dev mostra o endereço tentado: o erro mais comum é a URL da API errada
    return typeof __DEV__ !== 'undefined' && __DEV__ ? `${base} (${API_URL})` : base;
  }
  switch (err.code) {
    case 'INVALID_CREDENTIALS':
      return 'email ou senha incorretos';
    case 'CONFLICT':
      return 'esse email já tá em uso';
    case 'FORBIDDEN':
      return 'você não tem permissão pra isso';
    case 'NOT_FOUND':
      return 'não encontramos isso';
  }
  if (err.status === 429) {
    return err.retryAfter ? `calma! tenta de novo em ${err.retryAfter}s` : 'muitas tentativas, tenta de novo em instantes';
  }
  if (err.details?.length) return err.details.map((d) => d.message).join(' • ');
  if (err.status >= 500) return 'o servidor falhou, tenta de novo em instantes';
  return err.message;
}

