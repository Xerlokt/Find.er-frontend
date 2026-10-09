// Acrescenta mais vagas de teste (além das 8 do seed-test-data.mjs) para o feed não esvaziar durante os testes.
// Uso: node scripts/add-test-jobs.mjs [http://localhost:3000]
// Idempotente: pula a vaga cujo título o recrutador já tem. Usa só logins dos recrutadores (limite: 5/min).

const API = process.argv[2] ?? 'http://localhost:3000';
const PASSWORD = 'Senha123!';

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : undefined };
}

async function must(label, p) {
  const r = await p;
  if (r.status >= 400) throw new Error(`${label}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
}

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString();
const SP = { lat: -23.5505, lng: -46.6333 };
const CAMPINAS = { lat: -22.9099, lng: -47.0626 };

const DATA = [
  {
    email: 'recrutador1@test.com',
    jobs: [
      { title: 'Tech Lead Backend', professionId: 'backend-dev', modality: 'HYBRID', requiredSkills: ['nodejs', 'postgresql', 'typescript'], salaryMin: 16000, salaryMax: 22000, ...SP, discProfile: 'D', description: 'Lidera o time de backend e as decisões de arquitetura da plataforma de pagamentos.' },
      { title: 'Desenvolvedor(a) Fullstack Júnior', professionId: 'fullstack-dev', modality: 'REMOTE', requiredSkills: ['react', 'nodejs'], salaryMin: 5000, salaryMax: 7500, discProfile: 'S', description: 'Primeira vaga em tech? Mentoria semanal e projetos reais desde o primeiro mês.' },
      { title: 'Desenvolvedor(a) Mobile Sênior', professionId: 'mobile-dev', modality: 'REMOTE', requiredSkills: ['react-native', 'typescript', 'javascript'], salaryMin: 15000, salaryMax: 20000, discProfile: 'C', description: 'Evolui o app de pagamentos usado por milhares de lojistas.' },
    ],
  },
  {
    email: 'recrutador2@test.com',
    jobs: [
      { title: 'Engenheiro(a) de Dados', professionId: 'data-scientist', modality: 'REMOTE', requiredSkills: ['python', 'sql', 'aws'], salaryMin: 13000, salaryMax: 18000, discProfile: 'C', description: 'Pipelines de dados em nuvem para clientes de grande porte.' },
      { title: 'Desenvolvedor(a) Frontend Sênior React', professionId: 'frontend-dev', modality: 'HYBRID', requiredSkills: ['react', 'typescript', 'css', 'javascript'], salaryMin: 14000, salaryMax: 19000, ...CAMPINAS, discProfile: 'I', description: 'Design system e performance nos produtos web dos clientes.' },
      { title: 'SRE / Plataforma Cloud', professionId: 'devops', modality: 'REMOTE', requiredSkills: ['aws', 'docker', 'terraform'], salaryMin: 15000, salaryMax: 21000, discProfile: 'D', description: 'Confiabilidade, observabilidade e automação de infraestrutura.' },
    ],
  },
];

for (const r of DATA) {
  const { accessToken } = await must(`login ${r.email}`, call('/auth/login', { method: 'POST', body: { email: r.email, password: PASSWORD } }));
  const existing = await must('listar vagas', call('/jobs/mine', { token: accessToken }));
  const titles = new Set(existing.map((j) => j.title));
  for (const j of r.jobs) {
    if (titles.has(j.title)) {
      console.log(`  já existe: ${j.title}`);
      continue;
    }
    await must(`vaga ${j.title}`, call('/jobs', { method: 'POST', token: accessToken, body: { ...j, expiresAt: inDays(60) } }));
    console.log(`  vaga criada: ${j.title}`);
  }
}
