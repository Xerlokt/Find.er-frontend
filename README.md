# Find.er — app do candidato

O **Find.er** é um app de vagas de emprego que funciona como o Tinder: você vê uma vaga por vez, **arrasta para a direita** se quiser se candidatar e **para a esquerda** se não quiser. Se a empresa gostar do seu perfil, ela entra em contato e a conversa aparece no **chat** do app.

Este repositório é o **aplicativo de celular do candidato** (iPhone e Android), feito com React Native + Expo. Ele conversa com um servidor separado (o *backend*), que guarda usuários, vagas e mensagens.

> Para quem está começando: **frontend** é a parte que o usuário vê e toca (este repositório). **Backend** é o servidor que guarda os dados e aplica as regras. O app só mostra e envia informações para ele.

---

## O que o app faz

| Tela | O que acontece nela |
|---|---|
| **Cadastro e login** | Você cria uma conta de candidato com e-mail e senha. A sessão fica salva no celular. |
| **Perfil e teste DISC** | Na primeira vez você informa nome, profissão, skills, modalidades de trabalho (remoto, híbrido, presencial), pretensão salarial e raio de busca. Depois responde 4 perguntas do teste DISC (perfil comportamental). |
| **Home (feed de vagas)** | Pilha de cards de vagas. Cada card mostra empresa, salário, distância, skills e a **afinidade** (%) com o seu perfil. Arrastar o card, ou usar os botões, curte ou descarta a vaga. Um filtro por distância e skills fica no canto superior. |
| **Detalhe da vaga** | Toque num card para ver a descrição completa. |
| **Chat** | A conversa só aparece depois que a **empresa** manda a primeira mensagem. As mensagens chegam **em tempo real**, com aviso dentro do app (banner e contador de não lidas). |
| **Perfil** | Ver, editar seus dados e refazer o teste DISC. |
| **Métricas** | Ainda não existe: a aba mostra "em breve". |

Regra importante do produto: **curtir uma vaga é silencioso**. Não existe tela de "deu match". Quem decide é a empresa: ela vê quem curtiu e escolhe quem chamar.

---

## Como as peças se encaixam

```
 Celular (este app)                         Servidor (backend, outro repositório)
 ┌────────────────────┐   HTTP + JSON      ┌─────────────────────────────┐
 │ telas (app/)       │ ─────────────────▶ │ API Fastify (porta 3000)    │
 │ lógica (src/)      │ ◀───────────────── │  ├─ Postgres  (usuários,    │
 │                    │                    │  │   vagas, mensagens)      │
 │                    │   WebSocket        │  ├─ Neo4j  (afinidade       │
 │ chat em tempo real │ ◀════════════════▶ │  │   perfil × vaga)         │
 └────────────────────┘                    │  └─ Redis  (cache)          │
                                           └─────────────────────────────┘
```

1. Você faz login: o app envia e-mail e senha e recebe dois "crachás" (tokens). Um vale por pouco tempo e é usado nas chamadas; o outro fica guardado de forma segura no celular e renova o primeiro.
2. A home pede ao servidor as vagas ainda não vistas, já com a afinidade calculada.
3. Cada swipe é enviado ao servidor. O que você já viu não volta.
4. O chat usa uma conexão **WebSocket**, que fica aberta para as mensagens chegarem sem você puxar a tela.

O app **só usa o que o backend oferece**. O que o servidor ainda não tem (por exemplo, métricas) fica como "em breve" ou fora do app.

---

## Tecnologias

| Para quê | O que usamos |
|---|---|
| App de celular | **React Native** + **Expo** (SDK 57), em **TypeScript** |
| Telas e navegação | **Expo Router** (cada arquivo da pasta `app/` vira uma tela) |
| Dados do servidor | **TanStack Query** (busca, cache e atualização) |
| Estado local | **Zustand** (sessão, filtro da home, avisos) |
| Formulários | **React Hook Form** + **Zod** (validação) |
| Animações e gestos | **Reanimated** e **Gesture Handler** (o swipe dos cards) |
| Ícones e degradê | **react-native-svg** |
| Guardar a sessão | **Expo Secure Store** |
| Testes | **Vitest** |

---

## Como rodar no seu computador

### O que você precisa
- [Node.js](https://nodejs.org) (versão LTS) e npm
- O app **Expo Go** no celular (Android ou iPhone), ou um emulador Android
- O **backend** rodando (veja abaixo)

### 1. Instalar e abrir o app
```bash
npm install
npx expo start
```
Depois, escaneie o QR code com o Expo Go (o celular e o computador precisam estar no **mesmo Wi-Fi**) ou aperte `a` para abrir o emulador Android.

O arquivo `.npmrc` já inclui `legacy-peer-deps=true`, necessário para a instalação funcionar.

### 2. Ligar o backend
O backend é um projeto **separado** (Fastify + Prisma + Postgres + Neo4j + Redis). Com o Docker Desktop aberto, na pasta dele:
```bash
docker compose up -d
npm run dev          # API em http://localhost:3000  (confira http://localhost:3000/health)
```
O app descobre sozinho o endereço da API a partir do IP do computador que está servindo o app. Para forçar outro endereço:
```bash
# PowerShell
$env:EXPO_PUBLIC_API_URL = "http://SEU_IP:3000"; npx expo start
```
No celular físico, o firewall do Windows pode pedir para liberar a porta 3000.

### 3. Dados de teste
Com o backend no ar:
```bash
node scripts/seed-test-data.mjs      # cria empresas, recrutadores e 8 vagas de teste
node scripts/add-test-jobs.mjs       # acrescenta mais 6 vagas
node scripts/recruiter-says-hi.mjs recrutador1@test.com "oi!" --vaga=<início do id> --para=<nome>
                                     # o recrutador manda a 1ª mensagem (libera o chat do candidato)
```
As contas e a senha de teste estão no começo de `scripts/seed-test-data.mjs`. Elas servem **só** para o ambiente de desenvolvimento.

### Comandos úteis
```bash
npm test             # roda os testes (Vitest)
npm run typecheck    # confere os tipos do TypeScript
```

---

## Como o código está organizado

```
app/                    As telas (Expo Router: o nome do arquivo é a rota)
  (auth)/               login e cadastro
  (onboarding)/         criação do perfil e teste DISC
  (tabs)/               abas: home (swipe), métricas, chat, perfil
  job/[id].tsx          detalhe da vaga
  conversa/[id].tsx     conversa do chat
  empresa/[chatId].tsx  perfil da empresa e da vaga que abriu o chat
  _layout.tsx           carrega fontes e sessão e decide qual grupo de telas mostrar
src/
  api/                  conversa com o servidor (login, vagas, chat, perfil...)
  components/           peças visuais reutilizáveis (card da vaga, deck, botões...)
  lib/                  regras puras e testáveis (filtros, DISC, rotas, chat, animações...)
  store/                estado local (sessão, filtro, avisos)
  data/                 dados fixos (profissões, skills, perguntas do DISC)
  theme/                cores, fontes e sombras
scripts/                scripts de apoio para testes com o backend
design-reference/       protótipo visual original (HTML), só como referência
```

**Regra de ouro do projeto:** a lógica fica em arquivos simples de `src/lib` (fáceis de testar), e os componentes `.tsx` só ligam a tela a essa lógica. Assim a maior parte do app é coberta por testes sem precisar abrir o celular.

### Identidade visual
Cores: roxo `#6C4DF6`, rosa `#FF4D8F`, lime `#D8FF4A`, fundo creme `#F4EFE6`, tinta `#0E0913`. Fontes: Bricolage Grotesque (títulos), Inter (texto), JetBrains Mono (etiquetas). O texto do app é em português do Brasil, com tom casual e em minúsculas.

---

## Como trabalhamos: TDD

Todo código novo é feito em **TDD** (desenvolvimento guiado por testes):

1. **Red:** escreve o teste e vê ele **falhar**.
2. **Green:** escreve o mínimo de código para ele passar.
3. **Refactor:** limpa o código com os testes verdes.

Um bug encontrado no celular começa sempre por um teste que o reproduz. Antes de considerar algo pronto: `npm test` e `npm run typecheck` precisam estar verdes. Hoje são **247 testes**.

---

## Plano e estado do projeto

### O que já está feito
| Fase | Entrega | Estado |
|---|---|---|
| 1 | Projeto Expo, tema, fontes, ícones e abas | Feita |
| 2 | Cliente HTTP, sessão, login e cadastro | Feita |
| 3 | Onboarding de perfil e teste DISC | Feita |
| 4 | Feed com swipe e detalhe da vaga | Feita e validada no celular |
| 5 | Chat com conversa em tempo real | Feita e validada no celular |
| 6 | Perfil real (ver, editar, refazer DISC) | Feita e conferida no celular |
| 7 | Like silencioso, chat só após contato da empresa, filtro da home | Feita; filtro ainda por validar |
| 8 | Chat em tempo real global, aviso no app, perfil da empresa | Feita e validada (menos o perfil da empresa) |
| — | Testes retroativos das fases 1 a 4 | Feita |
| — | Home no estilo Tinder, animação de abrir o deck, ícone "F.er", tela de sem conexão | Feita |

### O que falta validar no celular
- Filtro da home (distância, tags e contador)
- Sair e entrar de novo sem herdar as mensagens não lidas da conta anterior
- Tela de perfil da empresa
- Tela de "sem conexão" quando o servidor está fora

### Próximos passos
1. **Anúncios no deck:** a cada 3 vagas swipadas, o próximo card seria um anúncio (como no Tinder). A ideia é começar com um anúncio fixo para fechar o comportamento (swipe dispensa, sem chamar o servidor) e depois integrar o **AdMob** do Google.
2. **Build de desenvolvimento (EAS):** necessário para ver o ícone e a splash novos, testar notificações push e usar o AdMob. O Expo Go não cobre isso.
3. **Notificação push:** o app e o backend já têm o código; falta testar num build real.
4. **Pedidos ao backend:** a lista de última mensagem e não lidas no `GET /chats`, empresa embutida no feed, filtros no servidor, entre outros. A lista completa está no `PLANO.md`.
5. **Área do recrutador:** hoje o cadastro de recrutador não é feito neste app. Está previsto um site para isso e, mais tarde, talvez uma área dentro do app.

O histórico detalhado de decisões, cuidados e lições está no [`PLANO.md`](./PLANO.md).

---

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| "não consegui falar com o servidor" | O backend está rodando? Abra `http://SEU_IP:3000/health` no navegador do celular. Se não abrir, é o firewall do Windows (porta 3000) ou o IP do computador mudou. Reinicie o `npx expo start`. |
| Home sem cards | O servidor só devolve vagas que você ainda não viu. Crie mais vagas com `node scripts/add-test-jobs.mjs`. |
| Erro "calma! tenta de novo" | O servidor limita 60 requisições por minuto por IP. Espere um pouco. |
| `npm install` reclama de dependências | Use o `.npmrc` do projeto (já incluso) ou `npm install --legacy-peer-deps`. |

---

## Observações

- O projeto é privado (`"private": true`) e ainda não tem licença definida.
- O app do candidato só cadastra contas de **candidato**.
