# Find.er — App do Candidato (Expo React Native)

App mobile do candidato, integrado ao backend em `C:\Users\Gian Coelho\Documents\Projetos\Backend_Find.er` (Fastify 5 + Prisma/Postgres + Neo4j + Redis, JWT, `http://localhost:3000`).
Decisões: **Expo React Native + TypeScript**; integrar **só o que o backend suporta**. O que não tem endpoint vira "em breve" ou fica de fora, e entra na lista de pedidos ao backend (abaixo).

Referência visual: `design-reference/` (mockup HTML/JSX original; ignorar `ios-frame.jsx` e `tweaks-panel.jsx`).

---

## Status por fase

| Fase | O que é | Status |
|---|---|---|
| 1 | Scaffold Expo, tema, fontes, ícones, abas | ✅ feita |
| 2 | Cliente HTTP + sessão + login/registro | ✅ feita |
| 3 | Onboarding de perfil + teste DISC | ✅ feita |
| 4 | Feed com swipe, detalhe da vaga (o popup de match foi removido na fase 7) | ✅ feita; **swipe e cards validados no aparelho (2026-10-07)** |
| 5 | Chat: lista + conversa em tempo real (WebSocket) | ✅ feita (34 testes); **validada no aparelho (2026-10-07):** mensagem ao vivo, resposta, teclado e reconexão após modo avião (conversa aberta e app fora da conversa) |
| 6 | Perfil real (ver/editar/DISC/sair), estados vazios | ✅ feita (13 testes); **falta validar no aparelho** (dados, editar, refazer DISC) — conferido pelo usuário em 2026-10-07, sem problemas apontados |
| 7 | Ajustes de produto: like sem match, chat só após contato da empresa, filtro da home | ✅ feita (24 testes); like em silêncio e chat só após contato da empresa **validados**; **falta validar o filtro da home** |
| **T** | **Testes retroativos (TDD atrasado) das fases 1–4 e ajustes recentes** — ver "Metodologia: TDD" | ✅ **feita** (94 testes, 13 arquivos) |
| 8 | Chat em tempo real global, aviso in-app, teclado na conversa, perfil da empresa (2026-10-05) | ✅ feita (28 testes); **validada no aparelho:** aviso in-app (banner, badge, abrir a conversa), teclado e chat ao vivo; falta perfil da empresa |

**Fase 8 (decisões):** o backend só tem WebSocket **por conversa**, então o app mantém **1 socket por chat** enquanto logado (`src/lib/liveInbox.ts` + hook `useLiveInbox` em `src/api/liveInbox.ts`, montado em `app/_layout.tsx`). Mensagem ao vivo → cache de prévia/histórico (`src/api/liveMessage.ts`) → badge da aba e lista atualizam sem trocar de tela; o polling de 20 s ficou só como rede de segurança. Aviso in-app: `src/lib/inAppNotice.ts` (regra), `src/store/notice.ts`, `src/components/InAppNotice.tsx` (banner ~4,5 s, toque abre a conversa; não avisa do chat aberto). Teclado: `KeyboardAvoidingView behavior="padding"` nas duas plataformas (antes `undefined` no Android). Nome da empresa no topo da conversa abre `app/empresa/[chatId].tsx` (empresa + vaga que abriu o chat; texto em `src/lib/companyView.ts`). Evolução: pedir ao backend um canal único por usuário (`/ws`) para não depender de N sockets.

**Correção (2026-10-07) — backend fora do ar não vira logout:** `restoreSession()` agora devolve `'signedIn' | 'signedOut' | 'offline'`. Falha de rede ou 5xx no `/auth/refresh` mantém o refresh token e leva à tela "sem conexão" (`resolveRoute` → `'offline'`, com "tentar de novo" e "sair") em vez do login; só 4xx limpa a sessão. Testes em `auth.test.ts` e `routes.test.ts`. Tela offline com a logo Find.er no centro e a mensagem embaixo.

**Validação no aparelho (2026-10-07):** app abriu direto na home com a sessão salva; cards, swipe, chat ao vivo, resposta, aviso in-app e teclado OK. Correções feitas durante o teste:
- **Loader:** novo `src/components/Loading.tsx` (spinner `large`, logo opcional com `logo`, bloco `inline`); substitui os `ActivityIndicator` de tela. Os spinners pequenos de `Button` e do envio do DISC ficaram.
- **Teclado cobria o chat:** o `KeyboardAvoidingView` de `app/conversa/[id].tsx` mede a posição relativa ao pai; o cabeçalho acima dele entrou como `keyboardVerticalOffset` (altura medida com `onLayout`). Confirmado no aparelho.
- **`scripts/recruiter-says-hi.mjs`:** ganhou `--vaga=<início do id>` e `--para=<parte do nome>`. Sem filtros ele manda em TODOS os chats do recrutador, e o chat é sempre de uma vaga — para testar, usar os filtros (ex.: `--vaga=089b591b --para=Lucas`, Dev Fullstack Pleno).
- **Feed vazio no teste:** o backend só devolve vagas ainda não swipadas. Para repetir o teste: `delete from "Swipe" where "candidateId"='<id do perfil>'` no Postgres (`docker exec backend_finder-postgres-1 psql -U jobtinder -d jobtinder`) e `docker exec backend_finder-redis-1 redis-cli del feed:<id do perfil>` (cache de 60 s).

**Home no estilo Tinder (2026-10-07, aprovada no aparelho):** card quase de borda a borda (`CARD_MARGIN = 10` em `app/(tabs)/index.tsx`); "foto" = cor da marca + formas + logo da empresa grande (o backend não tem imagem de vaga); degradê escuro por `react-native-svg` (sem dependência nova) com empresa, título, chips e skills em branco (`JobCard.tsx`; `SkillChip`/`InfoChip`/`JobFacts` ganharam `tone: 'light' | 'dark'`, o detalhe da vaga continua `light`); etiqueta lime "NN% match" no topo; carimbos ROLA (lime) / PASSA (vermelho) maiores em `SwipeDeck.tsx`; logo centralizada com o filtro à direita; botões brancos redondos: X vermelho (passar) e avião de papel verde (candidatar — "enviou"). Só visual, sem teste novo.

**Animação "espiar o deck" (2026-10-07):** ao abrir o app o baralho se abre em leque por ~1,7 s (a carta do topo sobe, as de baixo abrem para a esquerda, cada uma mais que a anterior) e volta para a pilha; toca **uma vez por abertura do app** e só com ≥ 2 cartas. Lógica pura e testada em `src/lib/deckPeek.ts` (`peekPose`, `consumeDeckIntro`; 7 testes); ligada em `SwipeDeck.tsx` por um `useSharedValue` `peek` somado à posição de cada `DeckCard`. Total: 247 testes. **Aprovada no aparelho (2026-10-07)** (durações/ângulos ajustáveis nas constantes de `deckPeek.ts` e nos `withTiming` do deck).

**Mais vagas de teste:** `node scripts/add-test-jobs.mjs` cria 6 vagas extras (3 por recrutador, idempotente por título) além das 8 do seed — total 14 no banco de dev. Serve para o feed não esvaziar (a animação de abertura precisa de ≥ 2 cartas).

**Ícone do app (2026-10-07):** "F.er" na fonte da logo (Bricolage Grotesque ExtraBold, tracking −3%), branco sobre roxo `#6C4DF6` com o ponto lime. Gerado com Pillow a partir do TTF de `@expo-google-fonts` (`icon.png` 1024 cheio; `android-icon-foreground/background/monochrome` com a marca dentro da zona segura do ícone adaptativo; `splash-icon.png` transparente; `favicon.png`). `app.json`: `adaptiveIcon.backgroundColor` e plugin `expo-splash-screen` com `backgroundColor #6C4DF6`, `imageWidth 220`. Os originais do template ficaram só na pasta temporária da sessão. **Só aparece em build (dev build/EAS): o Expo Go mantém o ícone e a splash dele.**

**Reconexão validada (2026-10-07):** com a conversa aberta e com o app em outra tela, depois de ~10 s em modo avião a mensagem do recrutador chegou sozinha (conversa, banner, badge e negrito na lista). Não testado: queda do backend (API parada ~20 s e religada).

**Ainda falta validar no aparelho:** filtro da home (slider/tags/contador); logout → login (não herdar não lidas); tela de perfil da empresa; tela offline com a logo.

**Verificação até agora:** `tsc --noEmit` limpo, 247 testes (antes 221) unitários (vitest) passando, bundle Android exportando.
**Parcialmente validado (2026-10-07):** feed, swipe e chat foram conferidos no aparelho contra o backend com vagas reais (lista acima); o fluxo de registro de conta nova → onboarding ainda não foi repetido. O único problema real encontrado no teste manual foi o login "girando para sempre" (corrigido: timeout de 12s + IP da API detectado automaticamente a partir do Metro).

---

## Decisões de produto (2026-10-04)

- **Cadastro de recrutador não é no app:** será em um **site web** (futuro). O app só cadastra `CANDIDATE`. Mais tarde pode ganhar uma **área do recrutador** dentro do app.
- **Like não mostra "match".** O candidato curte em silêncio. Quem age é a empresa: na tela do recrutador (web/futura) aparecem os candidatos que curtiram a vaga, e ele decide **entrar em contato**. Só quando a empresa manda a 1ª mensagem a conversa **aparece no chat** do candidato (`src/lib/chatInbox.ts`). O backend continua abrindo o chat no like (`chatId` no `POST /swipes`); o app apenas o esconde até haver mensagem do recrutador. O popup de match foi removido.
- **Filtro de vagas na home** (botão no canto superior direito, com contador): distância máxima (slider 5–200+ km; 200+ = sem limite) e **tags = skills do perfil do candidato** (a vaga precisa exigir ao menos uma das marcadas). É filtro **local** sobre o feed (`src/lib/feedFilter.ts`, estado em `src/store/feedFilter.ts`, só em memória): vaga sem localização nunca é descartada por distância; sem localização do candidato o filtro de distância não se aplica.
- **Aviso de mensagem nova (dentro do app):** badge com contador no ícone da aba chat + bolinha rosa e texto em negrito na conversa não lida. O backend marca mensagens como lidas ao buscá-las, então o `readAt` não serve: o app guarda localmente a última mensagem **vista** de cada chat (`src/store/chatSeen.ts`, SecureStore; limpo no logout) e calcula as não lidas em `src/lib/unread.ts`. Abrir a conversa marca como vista. A lista e as prévias são reconsultadas a cada 20 s (pausa com o app em segundo plano). **Ainda não há notificação push** (app fechado/em background): exige `expo-notifications` + token de push guardado no backend + envio quando a empresa escreve — pedido ao backend abaixo.
- O rótulo "match" nos cards/detalhe continua sendo o **percentual de afinidade** (`fitScore`), não o antigo popup.

---

## Metodologia: TDD (obrigatório daqui para frente)

**Regra:** todo código novo é escrito em TDD — ciclo **red → green → refactor**: (1) escrever o teste e vê-lo **falhar** pelo motivo certo; (2) escrever o mínimo de código para passar; (3) refatorar com os testes verdes. Nenhuma feature, correção de bug ou ajuste é considerado pronto sem teste. Bug encontrado no aparelho → primeiro um teste que reproduz, depois a correção.

**Como aplicar neste projeto (vitest, ambiente node, sem biblioteca de render de componentes):**
- Lógica vai para funções puras/hooks testáveis em `src/lib`, `src/api`, `src/store`; os componentes `.tsx` ficam finos (só ligam UI à lógica). Ex.: conversão do slider, regras de rota do onboarding, validação do formulário.
- Cliente HTTP, hooks de dados e stores: testar com `fetch` mockado (padrão já usado em `client.test.ts` / `candidates.test.ts`).
- Cada fase nova começa pelos testes. Fase 5 (chat), por exemplo: testes de dedupe por `id`, regra `RECRUITER_MUST_INITIATE`, reconexão com backoff **antes** da implementação.
- Antes de dar uma tarefa por concluída: `npm test` + `npm run typecheck` verdes.
- Se um componente precisar de teste de render, avaliar adicionar `@testing-library/react-native` (decisão registrada aqui quando acontecer).

### Dívida de testes (código feito sem TDD — fase T)
Fases 1–4 e os ajustes recentes foram implementados **sem** teste primeiro. Cobrir retroativamente (escrever o teste, ver passar; se revelar bug, corrigir):

| Área | O que testar | Já tem teste? |
|---|---|---|
| `src/api/client.ts` | Bearer, refresh em fila única, 401→refresh→retry, timeout | ✅ parcial (`client.test.ts`) |
| `src/api/candidates.ts` | 404 → `null`, PUT do perfil | ✅ parcial |
| `src/api/feedHooks.ts` | paginação/dedupe do feed | ✅ parcial |
| `src/lib/format.ts` | salário, tempo, distância, cor da marca | ✅ |
| `src/api/auth.ts` | `login`/`register` gravam tokens, `logout` limpa mesmo com falha, `restoreSession` | ✅ `auth.test.ts` |
| `src/store/session.ts` / `onboarding.ts` | hidratação do SecureStore, `setTokens`/`clear`, `pendingDisc` | ✅ `session.test.ts` |
| `src/api/errors.ts` | `friendlyMessage` para cada formato de erro (Zod, 429 com `retryAfter`, rede, timeout) | ✅ `errors.test.ts` |
| Gate de rotas (`app/_layout.tsx`) | sem login → auth; logado sem perfil (404) → onboarding; DISC pendente; com perfil → tabs. Extraído para `src/lib/routes.ts` (`resolveRoute`) | ✅ `routes.test.ts` |
| Onboarding | rota inicial = `profile-setup` (bug do spinner infinito após cadastro) — `onboardingInitialRoute` em `src/lib/routes.ts` | ✅ `routes.test.ts` |
| `ProfileForm` | schema zod (nome, skills ≥1, modalidades ≥1, salário), montagem do payload — `src/lib/profileForm.ts` | ✅ `profileForm.test.ts` |
| Raio de busca (slider) | extrair `radius.ts`: slider 5–200 km passo 5; **200 = "200+" = envia 20000** (backend só aceita inteiro positivo); valor salvo ≥200 → slider em 200; `Slider` converte posição→valor com clamp e passo — `src/lib/radius.ts` + `src/lib/slider.ts` | ✅ `radius.test.ts` |
| `src/data/disc.ts` + DISC | dados (4 perguntas × D/I/S/C), progressão (`src/lib/disc.ts`), envio com `:id` do perfil | ✅ `disc.test.ts` + `candidates.test.ts` |
| Swipe | POST `/swipes`, 409 `DUPLICATE_SWIPE`, 429 `retryAfter`, `chatId` no LIKE, política de falha (`src/lib/swipe.ts`) | ✅ `swipe.test.ts` (lib + api) |

**Ordem:** fazer a fase T antes de iniciar a Fase 5. Tudo da tabela está coberto. Fase 5 (chat) pode começar, já em TDD.

---

## Como rodar (todo dia)

**1. Backend** (`Backend_Find.er`)
```powershell
# abrir o Docker Desktop e esperar subir, depois:
docker compose up -d
npm run dev                  # API em http://localhost:3000  (confira /health)
```
- O banco de dev e o Neo4j já estão migrados/semeados (volumes persistem). Só precisa do seed de novo se o volume do Neo4j for apagado — ver "Seed do Neo4j" abaixo.

**2. Front** (`Find.er-Frontend`)
```powershell
npx expo start               # a = emulador Android | QR code = Expo Go no celular (mesmo Wi-Fi)
```
- A URL da API é detectada pelo IP do Metro. Para forçar: `$env:EXPO_PUBLIC_API_URL = "http://SEU_IP:3000"; npx expo start`.
- Celular físico: o Windows pode pedir para liberar a porta 3000 no firewall.

**Comandos úteis:** `npm test` (vitest) · `npm run typecheck`.

### Seed do Neo4j
O `scripts/seed-neo4j.ts` do backend está **quebrado** (imports de pastas que não existem mais). Foi rodado por um script temporário apontando para
`src/infrastructure/database/neo4j` e `src/adapters/services/recommendation.repository` (`seedTaxonomy()`), com `-P tsconfig.json` do backend. Resultado esperado: 6 profissões e 36 skills.

### Estado do banco de dev
(Depois de 2026-10-04: ver "Próximos passos" item 1 — 2 empresas, 8 vagas, admin e 2 recrutadores de teste. Antes disso estava vazio.)
Histórico: 0 usuários, 0 vagas. A migration `20260530000000_add_candidate_weights` foi marcada como aplicada (`migrate resolve`) porque a tabela já existia. Não houve reset.

---

## Próximos passos (amanhã)

**Prioridade agora:** todas as fases de código estão feitas; falta **validar o restante no aparelho** (lista em "Ainda falta validar" no topo) e corrigir o que quebrar — cada bug começa por um teste que o reproduz.

0. ~~Fase T — testes retroativos~~ ✅ feita. Tudo o que vier depois segue TDD.
1. ✅ **Dados de teste criados** (2026-10-04) com `node scripts/seed-test-data.mjs` (idempotente): admin `admin@test.com` / `Senha123!` (criado registrando como RECRUITER e promovendo no Postgres: `update "User" set role='ADMIN'`, porque `seed-admin.mjs` do backend não funciona com Prisma 7), recrutadores `recrutador1@test.com` (Nubloom, 4 vagas) e `recrutador2@test.com` (Orbita Labs, 4 vagas), senha `Senha123!`. Para testar o chat: curta uma vaga no app (o chat só aparecerá na aba depois da mensagem do recrutador) e rode `node scripts/recruiter-says-hi.mjs [email] [mensagem]` — o recrutador manda a 1ª mensagem e o campo de envio do candidato libera. Limite do backend: register 3/min, login 5/min.
2. **Validar fases 1–4 no aparelho** com o backend no ar: login/registro → onboarding → DISC → deck (arrastar, botões, popup de match, detalhe). Anotar o que quebrar.
3. **Fase 5 — Chat** (✅ implementada em TDD; só falta validar no aparelho — precisa de um recrutador que envie a 1ª mensagem):
   - Lista: `GET /chats` (shape real: `{id, jobId, initiatedBy, isActive, createdAt, candidateName, candidateUserId, companyName, recruiterUserId}`; **sem** última mensagem, não lidas nem título da vaga).
   - Histórico: `GET /chats/:chatId/messages?cursor&limit` (mais novas primeiro; marca como lidas).
   - Tempo real: WebSocket `ws://HOST:3000/chats/:chatId/ws`, JWT no header `Authorization` (React Native aceita headers). Enviar `{ "content": string 1..5000 }`; o servidor devolve a mensagem para **todos, inclusive o remetente** → **deduplicar por `id`**. Erros chegam como `{ "error": CODE }`.
   - **Regra do backend:** o candidato **não pode enviar a 1ª mensagem** (`RECRUITER_MUST_INITIATE`) → composer desabilitado com aviso até o recrutador escrever.
   - Sem typing indicator, sem evento de leitura, sem keepalive → reconectar com backoff ao cair.
   - Onde está: `src/api/chat.ts` (REST), `src/lib/chat.ts` (merge/dedupe, regra do recrutador, backoff, erros), `src/lib/chatSocket.ts` (WebSocket com reconexão; token renovado a cada tentativa), `src/api/chatHooks.ts` (`useChats`, `useConversation`), telas `app/(tabs)/chat.tsx` e `app/conversa/[id].tsx`.
4. **Fase 6 — Perfil** (✅ implementada em TDD; falta validar no aparelho. Texto da tela em `src/lib/profileView.ts`; telas `app/(tabs)/perfil.tsx`, `app/editar-perfil.tsx`, `app/refazer-disc.tsx`): mostrar dados reais (nome, bio, skills, modalidades, salário, DISC), editar reaproveitando `ProfileForm`, refazer DISC reaproveitando `DiscTest`, botão "sair da conta" (já existe).

---

## Arquitetura (resumo)

```
app/                       expo-router
  (auth)/login, register
  (onboarding)/profile-setup, disc
  (tabs)/index (swipe), metrics (em breve), chat, perfil
  job/[id].tsx             detalhe da vaga
  _layout.tsx              fontes + sessão + gate: sem login → (auth); sem perfil ou DISC pendente → (onboarding); senão → (tabs)
src/
  api/        client.ts (Bearer, refresh em fila única, timeout), errors.ts, auth.ts, candidates.ts, jobs.ts, hooks.ts, feedHooks.ts
  store/      session.ts (access token em memória, refresh no SecureStore), onboarding.ts
  components/ JobCard, SwipeDeck (reanimated + gesture-handler), MatchPopup, ProfileForm, DiscTest, Button, TextField, Chip, icons...
  data/       taxonomy.ts (ids de profissões/skills do seed), disc.ts (4 perguntas do backend)
  lib/format.ts  salário, tempo, distância, cor da marca
  theme/      cores, fontes, raios, sombras
```

**Identidade visual:** primary `#6C4DF6`, accent `#FF4D8F`, lime `#D8FF4A`, bg `#F4EFE6`, ink `#0E0913`; Bricolage Grotesque (títulos) / Inter (corpo) / JetBrains Mono (chips); UI em pt-BR, tom casual em minúsculas; títulos terminam com ponto rosa.

---

## Contrato com o backend (o que importa)

- **Auth:** `POST /auth/register` `{email, password≥8, role:'CANDIDATE'}`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/google` (não implementado no app). Access token JWT 15 min; refresh opaco 7 dias que **rotaciona** (reusar o antigo derruba a sessão inteira). Qualquer 401 → tentar refresh uma vez. Não existe `/auth/me`; a role vem do payload do JWT. Rate limit: login 5/min, register 3/min, swipe 30/min (429 com `retryAfter`).
- **Perfil:** `GET/PUT /candidates/me` (PUT é upsert; 404 = ainda sem perfil). Campos: name, bio?, lat?, lng?, professionId, skills[≥1], preferredModalities[≥1], salaryExpectation?, searchRadiusKm. IDs de profissão/skill são os do Neo4j (hardcoded em `taxonomy.ts`); ids desconhecidos pontuam 0.
- **DISC:** `POST/GET /candidates/:profileId/disc` — `:id` é o id do **perfil**, não do usuário. Body `{answers:[4 letras D/I/S/C]}` → `{dominant}`.
- **Feed:** `GET /jobs/feed?cursor&limit` → `{data: (Job + fitScore)[], nextCursor}`. Não traz empresa → `GET /companies/:id` por vaga (cacheado).
- **Swipe:** `POST /swipes` `{jobId, direction:'LIKE'|'DISLIKE'}` → 201 com `chatId` no LIKE (o backend abre o chat na hora). 409 `DUPLICATE_SWIPE` = já swipada.
- **Erros:** `{error, code}` | Zod `{error:'Validation error', details:[{field,message}]}` | 429 `{statusCode, error, retryAfter}`.

---

## Ficou de fora do app (design tem, backend não)
Aba **Metrics** inteira, streak, contador diário "x/30", filtros do feed, botão salvar (⭐), foto/benefícios da vaga, experiências/avatar/headline/stats do perfil, "novos matches" com online/digitando, última mensagem e não lidas no chat, busca no chat, login com Google (precisa de `GOOGLE_CLIENT_ID` compatível).

## Pedidos para o backend (lista para entregar)
0a. ✅ **Notificação push (feito 2026-10-04):** backend `PUT/DELETE /push-tokens` + envio via Expo quando o recrutador escreve (tabela `PushToken`, migration `20261004000000_add_push_token`); app registra o token no login, desregistra no logout e abre a conversa ao tocar no aviso. **Pendente para testar:** push remoto não funciona no Expo Go — precisa de development build (EAS) com `extra.eas.projectId` no `app.json` e, no Android, credenciais FCM.
0. **Lista de chats com última mensagem e não lidas** (hoje o app faz N+1: busca a 1ª página de mensagens de cada chat, o que também marca como lidas). Idealmente `GET /chats` devolver só chats com mensagem do recrutador, ou campos `lastMessage`/`unreadCount`. E **filtros do feed no servidor** (raio/tags) se o filtro local ficar limitado pela paginação. Para a tela do recrutador: endpoint com os candidatos que curtiram a vaga e ação "entrar em contato".
1. Empresa (nome, logo, rating) embutida no feed e em `/jobs/:id`; feed ordenado por `fitScore`; filtros (modalidade/raio/salário).
2. `GET /auth/me`; reset de senha; troca/exclusão de conta.
3. WebSocket aceitar token por query (só se houver versão web).
4. Lista de chats com última mensagem, não lidas e título da vaga; endpoint REST para enviar mensagem; permitir candidato iniciar (ou deixar claro na UI).
5. Endpoints de taxonomia (profissões/skills), histórico de likes/candidaturas, upload de avatar/currículo.
6. **Corrigir `scripts/seed-neo4j.ts`** (imports quebrados).
7. `GET /companies/:id` expõe `plan` e `credits` para candidatos — vazamento a revisar.
8. Credit chats: o spec fala em expiração de 3 dias e notificação; o código não implementa.

---

## Lições / cuidados
- **Limite global do backend: 60 req/min por IP** (`rate-limit.plugin.ts`; conta também o handshake do WebSocket). A caixa de entrada faz 1 req por chat (N+1), então o polling é de 90 s e a 1ª conexão de cada socket não recarrega a prévia. Com 20 s o app estourou o limite e mostrou "calma! tenta de novo" na aba chat. Se a lista crescer, pedir `lastMessage` no `GET /chats` ao backend.
- **TDD sempre** (ver "Metodologia: TDD"): teste falhando primeiro, depois o código.
- **Raio de busca:** no backend o raio **não filtra** vagas, só entra no score de localização (20% do match, `max(0, 1 - dist/raio)`). 200+ no app envia 20000 para a distância não pesar. Filtro real por raio seria mudança no backend (`get-feed`), ainda não pedida.
- **PowerShell 5.1 corrompe acentos** em `Get-Content -Raw | Set-Content` (lê UTF-8 como ANSI). Editar arquivos só com as ferramentas de edição. Isso já aconteceu uma vez e foi reparado (varredura confirmou projeto limpo).
- Callbacks passados a `useMutation().mutate()` se perdem em swipes rápidos → o app usa `mutateAsync`.
- `npm install` precisa de `legacy-peer-deps` (há `.npmrc`); `vite` foi instalado explicitamente por causa disso (vitest).
- O backend usa TS 6 + ts-node: rodar scripts avulsos exige `-P tsconfig.json` do backend.
