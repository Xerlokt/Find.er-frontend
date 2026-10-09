// Teste ponta a ponta do chat em tempo real contra o backend de dev (candidato x recrutador).
// Uso: node scripts/test-websocket.mjs [http://localhost:3000]
// Cria um candidato novo a cada execução (register: 3/min), curte uma vaga do recrutador1 e valida o contrato do WebSocket.

const API = process.argv[2] ?? 'http://localhost:3000';
const WS = API.replace(/^http/, 'ws');
const PASSWORD = 'Senha123!';

let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures++;
};

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : undefined };
}

const must = async (label, p) => {
  const r = await p;
  if (r.status >= 400) throw new Error(`${label}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};

/** Conecta e guarda tudo que chegar; resolve quando abrir (ou rejeita com o código de fechamento). */
function connect(chatId, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS}/chats/${chatId}/ws`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    const conn = { ws, inbox: [], closedWith: null, waiters: [] };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      conn.inbox.push(m);
      conn.waiters.splice(0).forEach((w) => w());
    };
    ws.onclose = (e) => {
      conn.closedWith = e.code;
      conn.waiters.splice(0).forEach((w) => w());
      reject(Object.assign(new Error(`fechou antes de abrir (código ${e.code})`), { code: e.code }));
    };
    ws.onerror = () => {};
    ws.onopen = () => {
      ws.onclose = (e) => {
        conn.closedWith = e.code;
        conn.waiters.splice(0).forEach((w) => w());
      };
      resolve(conn);
    };
  });
}

/** Espera chegar uma mensagem que satisfaça o predicado (ou estoura em `ms`). */
async function waitFor(conn, pred, ms = 4000) {
  const end = Date.now() + ms;
  for (;;) {
    const hit = conn.inbox.find(pred);
    if (hit) return hit;
    const left = end - Date.now();
    if (left <= 0) return null;
    await new Promise((r) => {
      const t = setTimeout(r, left);
      conn.waiters.push(() => {
        clearTimeout(t);
        r();
      });
    });
  }
}

const send = (conn, content) => conn.ws.send(JSON.stringify({ content }));

// ---------- preparação ----------
const email = `ws.${Date.now()}@test.com`;
await must('register', call('/auth/register', { method: 'POST', body: { email, password: PASSWORD, role: 'CANDIDATE' } }));
const cand = await must('login candidato', call('/auth/login', { method: 'POST', body: { email, password: PASSWORD } }));
const rec = await must('login recrutador', call('/auth/login', { method: 'POST', body: { email: 'recrutador1@test.com', password: PASSWORD } }));
const other = await must('login recrutador2', call('/auth/login', { method: 'POST', body: { email: 'recrutador2@test.com', password: PASSWORD } }));

await must('perfil', call('/candidates/me', {
  method: 'PUT',
  token: cand.accessToken,
  body: { name: 'Teste WebSocket', professionId: 'frontend-dev', skills: ['react', 'typescript'], preferredModalities: ['REMOTE'], searchRadiusKm: 20000 },
}));

const feed = await must('feed', call('/jobs/feed?limit=20', { token: cand.accessToken }));
const jobs = feed.data;
if (!jobs.length) throw new Error('feed vazio — rode scripts/seed-test-data.mjs');

// acha uma vaga do recrutador1 (Nubloom): tenta curtir até abrir um chat que ele enxergue
let chatId = null;
for (const job of jobs) {
  const r = await call('/swipes', { method: 'POST', token: cand.accessToken, body: { jobId: job.id, direction: 'LIKE' } });
  if (r.status !== 201 || !r.data.chatId) continue;
  const recChats = await must('chats do recrutador', call('/chats', { token: rec.accessToken }));
  if (recChats.some((c) => c.id === r.data.chatId)) {
    chatId = r.data.chatId;
    break;
  }
}
if (!chatId) throw new Error('não consegui abrir um chat com o recrutador1');
console.log(`candidato ${email} · chat ${chatId}\n`);

// ---------- cenários ----------
// 1. sem token não conecta
try {
  await connect(chatId, null);
  check('sem token é recusado', false, 'conectou');
} catch {
  check('sem token é recusado', true);
}

// 2. quem não participa do chat é recusado (o app espera 1008)
// o backend aceita o upgrade e fecha logo depois com 1008 (o ChatSocket do app trata esse código como FORBIDDEN)
try {
  const intruder = await connect(chatId, other.accessToken);
  const closed = await new Promise((res) => {
    if (intruder.closedWith) return res(intruder.closedWith);
    const t = setTimeout(() => res(null), 3000);
    intruder.waiters.push(() => {
      clearTimeout(t);
      res(intruder.closedWith);
    });
  });
  check('recrutador de outra empresa é fechado com 1008', closed === 1008, `código ${closed}`);
} catch (e) {
  check('recrutador de outra empresa é fechado com 1008', e.code === 1008, `código ${e.code}`);
}

const c = await connect(chatId, cand.accessToken);
const r = await connect(chatId, rec.accessToken);
check('candidato e recrutador conectam', true);

// 3. candidato não pode abrir a conversa
send(c, 'Oi, tudo bem?');
const err = await waitFor(c, (m) => m.error);
check('candidato não envia a 1ª mensagem', err?.error === 'RECRUITER_MUST_INITIATE', JSON.stringify(err));

// 4. recrutador escreve: chega nos dois (inclusive o remetente) com o mesmo id
send(r, 'Olá! Gostamos do seu perfil.');
const toCand = await waitFor(c, (m) => m.content === 'Olá! Gostamos do seu perfil.');
const echo = await waitFor(r, (m) => m.content === 'Olá! Gostamos do seu perfil.');
check('mensagem do recrutador chega ao candidato em tempo real', !!toCand);
check('remetente recebe o eco (app deduplica por id)', !!echo && echo.id === toCand?.id, `id ${echo?.id}`);

// 5. agora o candidato pode responder
send(c, 'Obrigado! Tenho interesse.');
const reply = await waitFor(r, (m) => m.content === 'Obrigado! Tenho interesse.');
check('candidato responde depois do recrutador', !!reply);

// 6. validação de conteúdo
send(c, '');
const emptyErr = await waitFor(c, (m) => m.error && m !== err);
check('mensagem vazia é rejeitada', !!emptyErr, JSON.stringify(emptyErr));

// 7. histórico REST contém as duas mensagens (mais novas primeiro)
const hist = await must('histórico', call(`/chats/${chatId}/messages?limit=20`, { token: cand.accessToken }));
const list = Array.isArray(hist) ? hist : hist.data;
check('histórico traz as 2 mensagens, mais nova primeiro', list?.length === 2 && list[0].content === 'Obrigado! Tenho interesse.', `${list?.length} msgs`);

// 8. reconexão: derruba e reconecta, mensagem enviada nesse meio-tempo vem pelo histórico
c.ws.close();
await new Promise((res) => setTimeout(res, 300));
send(r, 'Mensagem enquanto você estava offline.');
await new Promise((res) => setTimeout(res, 300));
const c2 = await connect(chatId, cand.accessToken);
const missed = await must('histórico pós-reconexão', call(`/chats/${chatId}/messages?limit=20`, { token: cand.accessToken }));
const missedList = Array.isArray(missed) ? missed : missed.data;
check('mensagem perdida na queda aparece no histórico ao reconectar', missedList?.some((m) => m.content === 'Mensagem enquanto você estava offline.'));

r.ws.close();
c2.ws.close();
console.log(failures ? `\n${failures} verificação(ões) falharam` : '\ntudo certo');
process.exit(failures ? 1 : 0);
