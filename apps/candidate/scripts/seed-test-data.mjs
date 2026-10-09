// Cria dados de teste no backend de dev: 2 empresas, 2 recrutadores e vagas.
// Uso: node scripts/seed-test-data.mjs [http://localhost:3000]
// Idempotente: se o recrutador já tem empresa/vagas, não duplica. Precisa do admin@test.com (role ADMIN).
// Rate limit do backend: register 3/min, login 5/min — o script usa 1 login (admin) + 1 login por recrutador (e register só se faltar a conta).

const API = process.argv[2] ?? 'http://localhost:3000';
const PASSWORD = 'Senha123!';
const ADMIN = { email: 'admin@test.com', password: PASSWORD };

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

// São Paulo / Campinas / Rio — o candidato de teste pode estar em qualquer lugar; o raio só pesa no score.
const SP = { lat: -23.5505, lng: -46.6333 };
const CAMPINAS = { lat: -22.9099, lng: -47.0626 };
const RIO = { lat: -22.9068, lng: -43.1729 };

const DATA = [
  {
    email: 'recrutador1@test.com',
    company: { name: 'Nubloom', description: 'Fintech de pagamentos para pequenos negócios.' },
    jobs: [
      { title: 'Desenvolvedor(a) Frontend React', professionId: 'frontend-dev', modality: 'REMOTE', requiredSkills: ['react', 'typescript', 'css'], salaryMin: 9000, salaryMax: 13000, discProfile: 'I', description: 'Construa interfaces rápidas e acessíveis para o app de cobrança da Nubloom.' },
      { title: 'Engenheiro(a) Backend Node.js', professionId: 'backend-dev', modality: 'HYBRID', requiredSkills: ['nodejs', 'typescript', 'postgresql'], salaryMin: 11000, salaryMax: 16000, ...SP, discProfile: 'C', description: 'APIs de alta disponibilidade com Node, TypeScript e Postgres.' },
      { title: 'Dev Fullstack Pleno', professionId: 'fullstack-dev', modality: 'REMOTE', requiredSkills: ['react', 'nodejs', 'typescript'], salaryMin: 10000, salaryMax: 14000, discProfile: 'D', description: 'Entrega ponta a ponta de features de produto.' },
      { title: 'Desenvolvedor(a) Mobile React Native', professionId: 'mobile-dev', modality: 'REMOTE', requiredSkills: ['react-native', 'typescript'], salaryMin: 10000, salaryMax: 15000, discProfile: 'S', description: 'App mobile usado por milhares de lojistas.' },
    ],
  },
  {
    email: 'recrutador2@test.com',
    company: { name: 'Orbita Labs', description: 'Consultoria de dados e cloud para grandes empresas.' },
    jobs: [
      { title: 'Engenheiro(a) DevOps', professionId: 'devops', modality: 'HYBRID', requiredSkills: ['docker', 'kubernetes', 'aws', 'terraform'], salaryMin: 14000, salaryMax: 19000, ...CAMPINAS, discProfile: 'C', description: 'Plataforma interna, CI/CD e infraestrutura como código.' },
      { title: 'Cientista de Dados', professionId: 'data-scientist', modality: 'REMOTE', requiredSkills: ['python', 'sql'], salaryMin: 12000, salaryMax: 17000, discProfile: 'C', description: 'Modelos de previsão de demanda e análises para clientes.' },
      { title: 'Desenvolvedor(a) Python / Django', professionId: 'backend-dev', modality: 'IN_PERSON', requiredSkills: ['python', 'django', 'postgresql'], salaryMin: 8000, salaryMax: 12000, ...RIO, discProfile: 'S', description: 'Sistemas internos e integrações para o time de operações.' },
      { title: 'Desenvolvedor(a) Frontend Vue', professionId: 'frontend-dev', modality: 'REMOTE', requiredSkills: ['vue', 'javascript', 'css'], salaryMin: 7000, salaryMax: 10000, discProfile: null, description: 'Dashboards de dados em Vue 3.' },
    ],
  },
];

const admin = await must('login admin', call('/auth/login', { method: 'POST', body: ADMIN }));

for (const r of DATA) {
  // tenta login primeiro (limite maior que o do register); só cadastra se a conta ainda não existe
  let tokens = await call('/auth/login', { method: 'POST', body: { email: r.email, password: PASSWORD } });
  if (tokens.status === 401) tokens = await call('/auth/register', { method: 'POST', body: { email: r.email, password: PASSWORD, role: 'RECRUITER' } });
  const { accessToken } = await must(`auth ${r.email}`, Promise.resolve(tokens));

  let profile = await call('/recruiters/me', { token: accessToken });
  if (profile.status === 404) {
    const company = await must('criar empresa', call('/companies', { method: 'POST', token: admin.accessToken, body: r.company }));
    profile = { data: await must('perfil do recrutador', call('/recruiters/me', { method: 'PUT', token: accessToken, body: { companyId: company.id } })) };
    console.log(`empresa criada: ${r.company.name}`);
  }

  const existing = await must('listar vagas', call('/jobs/mine', { token: accessToken }));
  if (existing.length > 0) {
    console.log(`${r.email}: já tem ${existing.length} vagas, nada a fazer`);
    continue;
  }
  for (const j of r.jobs) {
    await must(`vaga ${j.title}`, call('/jobs', { method: 'POST', token: accessToken, body: { ...j, expiresAt: inDays(60) } }));
    console.log(`  vaga criada: ${j.title}`);
  }
}

console.log('\nPronto. Recrutadores: recrutador1@test.com / recrutador2@test.com  (senha Senha123!)');
