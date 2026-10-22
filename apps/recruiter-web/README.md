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
3. **Candidatos**: ao criar a vaga o site já abre o ranking por fit (`GET /jobs/:id/ranking`) com os melhores candidatos da profissão, mesmo sem swipe. Quem deu LIKE aparece completo (`status: REVEALED`); quem deu DISLIKE ou ainda não viu a vaga aparece **censurado** (`status: LOCKED`, sem nome/foto/id, com um `unlockToken` opaco). O recrutador espera o candidato curtir (libera sem custo) ou desbloqueia com créditos: 2 (FREE) ou 1 (PRO), o que abre um chat. Sem saldo, o botão fica desabilitado.
4. **Conversas**: lista e histórico (`GET /chats`, `GET /chats/:id/messages`).

Empresas novas começam com 0 créditos. O saldo fica sempre na navbar (chip `◆ N créditos`, em vermelho quando não cobre um desbloqueio) e clicar leva a `/creditos`: pacotes (`GET /credits/packages`), compra (`POST /credits/purchase`) e extrato (`GET /credits/transactions`). **A compra é simulada**: o backend aprova na hora e credita (não há gateway). O admin também pode conceder saldo (`PATCH /admin/companies/:id/credits`).

5. **Empresa** (`/empresa`), em abas:
   - **perfil**: nome fantasia, bio (até 1000 caracteres) e logo (`PATCH /companies/:id`, `POST /companies/:id/logo`). Razão social e CNPJ não mudam.
   - **fotos**: galeria de até 8 imagens JPEG/PNG/WebP de até 5 MB (`POST /companies/:id/photos`, `DELETE /companies/:id/photos/:photoId`). O backend guarda em disco local (`uploads/`, variável `PUBLIC_URL` no backend).
   - **estatísticas** (`GET /companies/:id/stats`): por vaga, quantos viram, likes, dislikes e taxa de like, com ordenação e destaque de quem atrai mais/menos atenção. "Viram" = a vaga apareceu no feed do candidato (uma vez por candidato) e só conta depois que o backend passou a registrar isso.

Para ver o ranking com bastante gente, rode no backend `npm run seed:candidates` (24 candidatos `@mock.finder.test`, senha `Senha123!`, idempotente; alguns já com like/dislike nas vagas do `recrutador1@test.com`).

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

- **Comprar créditos**: o fluxo existe, mas o pagamento é simulado (sem gateway/webhook). Os preços dos pacotes (`credits.constants.ts` no backend) são placeholder.
- **Aviso ao recrutador quando o candidato curte depois**: não há notificação, o card só muda de estado ao recarregar o ranking.
- **Ranking**: sem paginação; os candidatos sem swipe vêm limitados a 50 por vaga (mesma profissão).
- **Chat em tempo real / envio**: o WebSocket (`/chats/:id/ws`) só autentica por header `Authorization`, que o navegador não envia. Chat fica somente leitura até o backend aceitar token na query. Regra: o recrutador deve mandar a 1ª mensagem.
- **Multiusuário**: um login por empresa; convidar outros recrutadores fica para depois.
- `POST /auth/register` com `role: RECRUITER` ainda existe no backend (legado, sem empresa); o site não usa.
- Sem endpoints para: taxonomia (profissões/skills ficam em `src/data/taxonomy.ts`), status de candidatura, busca de candidatos, métricas.
- Rate limit: 60 req/min por IP (login 5/min) — erros 429 mostram o tempo de espera.

## Sessão

O access token (15 min) fica só em memória; o refresh token (7 dias, rotativo) fica em `localStorage` e é renovado em 401 de forma deduplicada (`src/api/client.ts`). O papel vem do JWT (não existe `/auth/me`).

## Scripts

`npm -w apps/recruiter-web run dev | build | test | typecheck`
