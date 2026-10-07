// O recrutador manda a 1ª mensagem nos chats abertos dele (necessário para o candidato poder responder).
// Uso: node scripts/recruiter-says-hi.mjs [recrutador1@test.com] [mensagem] [http://localhost:3000] [--vaga=<início do id>] [--para=<parte do nome>]
// Sem filtros, manda em TODOS os chats. --vaga e --para restringem a uma vaga e/ou a um candidato (o chat é sempre de uma vaga).
// Fluxo de teste: curta uma vaga no app (abre o chat) → rode este script → a mensagem chega em tempo real no app.

const flags = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split(/=(.*)/s).slice(0, 2)),
);
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const email = args[0] ?? 'recrutador1@test.com';
const text = args[1] ?? 'Oi! Vi seu perfil e gostei muito. Podemos conversar?';
const API = args[2] ?? 'http://localhost:3000';

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  const body = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${body}`);
  return JSON.parse(body);
}

const { accessToken } = await call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'Senha123!' }) });
const all = await call('/chats', { headers: { Authorization: `Bearer ${accessToken}` } });
const chats = all.filter(
  (c) =>
    (!flags.vaga || c.jobId.startsWith(flags.vaga)) &&
    (!flags.para || c.candidateName.toLowerCase().includes(flags.para.toLowerCase())),
);

if (chats.length === 0) {
  console.log(all.length === 0
    ? 'Nenhum chat aberto para este recrutador. Curta uma vaga dele no app primeiro.'
    : 'Nenhum chat bate com --vaga/--para.');
  process.exit(0);
}

for (const chat of chats) {
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`${API.replace(/^http/, 'ws')}/chats/${chat.id}/ws`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const timer = setTimeout(() => reject(new Error(`timeout no chat ${chat.id}`)), 8000);
    ws.onopen = () => ws.send(JSON.stringify({ content: text }));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      clearTimeout(timer);
      if (m.error) reject(new Error(`chat ${chat.id}: ${m.error}`));
      else {
        console.log(`mensagem enviada para ${chat.candidateName} (vaga ${chat.jobId.slice(0, 8)})`);
        ws.close();
        resolve();
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`falha ao conectar no chat ${chat.id}`));
    };
  });
}
