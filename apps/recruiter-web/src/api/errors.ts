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

const BY_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: 'email ou senha incorretos',
  CONFLICT: 'esse email já tá em uso',
  INVALID_CNPJ: 'CNPJ inválido',
  CNPJ_NOT_FOUND: 'CNPJ não encontrado na Receita Federal',
  CNPJ_NOT_ACTIVE: 'só empresas com situação cadastral ATIVA podem se cadastrar',
  CNPJ_ALREADY_REGISTERED: 'já existe uma conta para este CNPJ',
  CNPJ_LOOKUP_UNAVAILABLE: 'a consulta da Receita está indisponível, tenta de novo em instantes',
  FORBIDDEN: 'você não tem permissão pra isso',
  NOT_FOUND: 'não encontramos isso',
  INSUFFICIENT_CREDITS: 'créditos insuficientes pra desbloquear',
  ALREADY_UNLOCKED: 'esse candidato já foi desbloqueado',
  CANDIDATE_ALREADY_VISIBLE: 'esse candidato já curtiu a vaga, o perfil já está visível',
  RECRUITER_MUST_INITIATE: 'o recrutador precisa mandar a primeira mensagem',
};

/** Texto amigável em pt-BR para exibir ao usuário. */
export function friendlyMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'algo deu errado, tenta de novo';
  if (err.isNetwork) return 'não consegui falar com o servidor. confere a conexão (e o CORS do backend) e tenta de novo';
  if (err.code && BY_CODE[err.code]) return BY_CODE[err.code];
  if (err.status === 429) {
    return err.retryAfter ? `calma! tenta de novo em ${err.retryAfter}s` : 'muitas tentativas, tenta de novo em instantes';
  }
  if (err.details?.length) return err.details.map((d) => d.message).join(' • ');
  if (err.status >= 500) return 'o servidor falhou, tenta de novo em instantes';
  return err.message;
}
