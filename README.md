# Find.er — frontend

O Find.er tem **dois produtos** com públicos diferentes, ambos consumindo o mesmo backend (`Backend_Find.er`, Fastify na porta 3000). Este repositório é um monorepo (npm workspaces) que separa os dois:

| | 📱 App do **candidato** | 💼 Site do **recrutador** |
|---|---|---|
| Pasta | [`apps/candidate`](apps/candidate/README.md) | [`apps/recruiter-web`](apps/recruiter-web/README.md) |
| Plataforma | Mobile (iOS/Android) | Web (navegador) |
| Stack | React Native + Expo Router | React + Vite + TypeScript |
| Papel no backend | `CANDIDATE` | `RECRUITER` (conta da **empresa**, cadastrada com CNPJ) |
| O que faz | Swipe de vagas, perfil, teste DISC, chat | Criar/editar/encerrar vagas, ranking de candidatos por fit, desbloquear candidatos (créditos), ver conversas |
| Endpoints principais | `/candidates/*`, `/jobs/feed`, `/swipes`, `/chats*` | `/auth/register-company` (CNPJ), `/recruiters/me`, `/jobs` (CRUD), `/jobs/:id/ranking`, `/jobs/:id/candidates/:cid/unlock`, `/companies/:id`, `/chats*` |
| Rodar | `npm run candidate` | `npm run recruiter` (http://localhost:5173) |

Autenticação é comum (`/auth/*`); o papel vem no JWT. Cada app só aceita o seu papel: o site do recrutador mostra um aviso se entrar um candidato.

## Como rodar

```bash
npm install            # instala os dois apps (workspaces)
npm run candidate      # app do candidato (Expo)
npm run recruiter      # site do recrutador (Vite)
npm test               # testes dos dois apps
npm run typecheck      # tipos dos dois apps
```

O backend precisa estar de pé (`docker compose up -d` + `npm run dev` em `Backend_Find.er`). Para o **site** funcionar no navegador, adicione `http://localhost:5173` em `ALLOWED_ORIGINS` no `.env` do backend (CORS; sem isso o site mostra "não consegui falar com o servidor").

## Verificação de email

Candidato e recrutador precisam validar o email antes de usar o produto, como em qualquer app:

1. Ao cadastrar, o backend manda um **código de 6 dígitos** por email (vale 10 min, 5 tentativas, reenvio a cada 60 s).
2. Enquanto `emailVerified` for falso no JWT, o app/site só mostra a tela de código (`apps/candidate/app/verify-email.tsx`, rota `/verificar-email` no site). As rotas protegidas do backend respondem `403 EMAIL_NOT_VERIFIED`.
3. Errou o email? Na própria tela, **"email errado? trocar"** corrige o endereço e reenvia o código.
4. Cadastro abandonado (email nunca verificado) não segura email nem CNPJ: recadastrar substitui a conta antiga.

Rotas usadas: `POST /auth/email/send`, `/auth/email/verify` e `/auth/email/change`. Contas existentes antes dessa mudança precisam validar no próximo login. Sem `SMTP_*` configurado no backend, o código é impresso no terminal dele (modo dev).

## Estrutura

```
apps/
  candidate/        app mobile do candidato (Expo)
  recruiter-web/    site do recrutador (Vite + React)
```

Os dois apps ainda não compartilham código (o site copiou/adaptou `client.ts`, `errors.ts`, `taxonomy.ts` e `format.ts` do app). Extrair um pacote `packages/shared` é um passo futuro, quando a duplicação começar a doer.
