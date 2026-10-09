# Find.er — site do recrutador

> 💼 **Este é o site do RECRUTADOR** (web). O app do candidato fica em [`../candidate`](../candidate/README.md). Visão geral no [README da raiz](../../README.md).

React + Vite + TypeScript, TanStack Query, react-hook-form + zod, zustand. Visual segue a marca do app (roxo `#6C4DF6`, rosa `#FF4D8F`, lima `#D8FF4A`, fundo `#F4EFE6`).

## Rodar

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:3000
npm run recruiter        # da raiz do monorepo → http://localhost:5173
```

O cadastro depende do backend com a migration `add_company_cnpj` aplicada (`npx prisma migrate deploy`) e acesso à internet (BrasilAPI). No backend (`Backend_Find.er/.env`) inclua `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173`, senão o navegador bloqueia por CORS.

## Fluxo da empresa

A conta é **da empresa, não do RH**: um login por CNPJ.

1. **Cadastro** (`/cadastro`): informa o CNPJ (máscara + dígitos verificadores no navegador). Com o CNPJ válido, o site consulta `GET /auth/cnpj/:cnpj` (backend → BrasilAPI/Receita) e mostra razão social, nome fantasia, cidade/UF e situação. Só empresas **ATIVAS** e **sem conta** avançam. Depois email, senha, descrição opcional e aceite de termos/LGPD → `POST /auth/register-company` (cria usuário, empresa e vínculo numa transação; o backend revalida tudo).
2. **Vagas**: listar (`GET /jobs/mine`), criar (`POST /jobs`), editar (`PATCH /jobs/:id`), encerrar (`DELETE /jobs/:id/deactivate`, irreversível).
3. **Candidatos**: ranking por fit (`GET /jobs/:id/ranking`). Quem deu LIKE aparece completo; quem deu DISLIKE aparece censurado. Desbloquear custa 2 créditos (FREE) ou 1 (PRO) e abre um chat.
4. **Conversas**: lista e histórico (`GET /chats`, `GET /chats/:id/messages`).

Empresas novas começam com 0 créditos; quem concede é o admin (`PATCH /admin/companies/:id/credits`).

## Telas ↔ endpoints

| Tela | Endpoints |
|---|---|
| Login | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Cadastro da empresa | `GET /auth/cnpj/:cnpj`, `POST /auth/register-company` |
| Empresa | `GET /recruiters/me`, `GET /companies/:id` |
| Vagas | `/jobs/mine`, `/jobs`, `/jobs/:id`, `/jobs/:id/deactivate` |
| Candidatos | `/jobs/:id/ranking`, `/jobs/:id/candidates/:cid/unlock` |
| Conversas | `/chats`, `/chats/:id/messages` |

## Limitações atuais (dependem do backend)

- **Desbloquear candidatos censurados**: o ranking omite o `candidateId` de quem não curtiu a vaga, então não dá para chamar `/unlock`. A UI mostra o aviso.
- **Chat em tempo real / envio**: o WebSocket (`/chats/:id/ws`) só autentica por header `Authorization`, que o navegador não envia. Chat fica somente leitura até o backend aceitar token na query. Regra: o recrutador deve mandar a 1ª mensagem.
- **Multiusuário**: um login por empresa; convidar outros recrutadores fica para depois.
- `POST /auth/register` com `role: RECRUITER` ainda existe no backend (legado, sem empresa); o site não usa.
- Sem endpoints para: taxonomia (profissões/skills ficam em `src/data/taxonomy.ts`), status de candidatura, busca de candidatos, métricas.
- Rate limit: 60 req/min por IP (login 5/min) — erros 429 mostram o tempo de espera.

## Sessão

O access token (15 min) fica só em memória; o refresh token (7 dias, rotativo) fica em `localStorage` e é renovado em 401 de forma deduplicada (`src/api/client.ts`). O papel vem do JWT (não existe `/auth/me`).

## Scripts

`npm -w apps/recruiter-web run dev | build | test | typecheck`
