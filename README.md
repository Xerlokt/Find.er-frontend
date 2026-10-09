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

O backend precisa estar de pé (`docker compose up -d` + `npm run dev` em `Backend_Find.er`). Para o **site** funcionar no navegador, adicione `http://localhost:5173` em `ALLOWED_ORIGINS` no `.env` do backend (CORS).

## Estrutura

```
apps/
  candidate/        app mobile do candidato (Expo)
  recruiter-web/    site do recrutador (Vite + React)
```

Os dois apps ainda não compartilham código (o site copiou/adaptou `client.ts`, `errors.ts`, `taxonomy.ts` e `format.ts` do app). Extrair um pacote `packages/shared` é um passo futuro, quando a duplicação começar a doer.
