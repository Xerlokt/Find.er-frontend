// Jobera Profile screen — same Gen Z aesthetic as Home
const ProfIcons = window.JoberaIcons;

const PROFILE_DATA = {
  name: "Maria Clara Souza",
  handle: "@mclaras",
  headline: "Product Designer • procurando vaga sênior",
  location: "São Paulo, SP",
  avatarBg: "linear-gradient(135deg, #FF4D8F 0%, #FFB3D1 40%, #6C4DF6 100%)",
  initial: "M",
  bio: "Designer que ama sistemas, edge cases e cafezinho. 5+ anos. Última empresa: Méliuz. Buscando time enxuto, propósito real e remote-first.",
  completion: 86,
  stats: {
    streak: 7,
    applies: 142,
    matches: 23,
    interviews: 5,
  },
  skills: [
    { label: "Figma", level: "expert" },
    { label: "Design System", level: "expert" },
    { label: "User Research", level: "avançado" },
    { label: "Prototipagem", level: "avançado" },
    { label: "Design Tokens", level: "avançado" },
    { label: "Webflow", level: "intermediário" },
    { label: "Motion / After Effects", level: "intermediário" },
  ],
  experience: [
    {
      role: "Product Designer Sênior",
      company: "Méliuz",
      brand: "#E91E63",
      period: "2023 — 2025",
      where: "São Paulo • Híbrido",
    },
    {
      role: "Product Designer Pleno",
      company: "QuintoAndar",
      brand: "#FF4500",
      period: "2021 — 2023",
      where: "Remoto",
    },
    {
      role: "Designer Júnior",
      company: "Conta Azul",
      brand: "#1A8F5C",
      period: "2019 — 2021",
      where: "Joinville • Presencial",
    },
  ],
  preferences: {
    salary: "R$ 14k – 22k",
    modes: ["Remoto", "Híbrido"],
    contract: ["CLT", "PJ"],
    type: "Sênior • Lead",
    industries: ["Fintech", "SaaS", "Health"],
  },
};

function ProfileScreen({ palette, matchedToday }) {
  const p = PROFILE_DATA;
  return (
    <div className="profile-root" data-screen-label="Profile">
      {/* HERO */}
      <div className="prof-hero">
        <div className="prof-hero-bg" style={{ background: p.avatarBg }}/>
        <div className="prof-hero-tabs">
          <span className="hero-tab">Find<span style={{ color: palette.accent }}>.</span>er</span>
          <button className="hero-edit" aria-label="Editar perfil">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l4-1 11-11-3-3L4 17l-1 4z"/>
            </svg>
          </button>
        </div>

        <div className="prof-avatar-wrap">
          <div className="prof-avatar" style={{ background: p.avatarBg }}>
            <span>{p.initial}</span>
            <div className="prof-avatar-status" title="Procurando vaga"/>
          </div>
        </div>
      </div>

      {/* IDENTITY */}
      <div className="prof-identity">
        <div className="prof-name-row">
          <h1 className="prof-name">{p.name}</h1>
          <span className="prof-verified" title="Verificada">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={palette.primary}>
              <path d="M12 1l2.4 2.6 3.5-.4.4 3.5 2.6 2.3-1.7 3.1 1.7 3.1-2.6 2.3-.4 3.5-3.5-.4L12 23l-2.4-2.6-3.5.4-.4-3.5L3.1 15l1.7-3.1L3.1 8.8l2.6-2.3.4-3.5 3.5.4L12 1z"/>
              <path d="M8 12l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <p className="prof-handle">{p.handle}</p>
        <p className="prof-headline">{p.headline}</p>
        <div className="prof-location">
          <ProfIcons.Pin size={13} stroke="rgba(14,9,19,0.55)" sw={2}/>
          <span>{p.location}</span>
        </div>

        {/* Status pill — Open to Work */}
        <div className="prof-status-pill">
          <span className="status-dot"/>
          <span>tô em busca</span>
          <span className="status-sub">• ativa há 2h</span>
        </div>
      </div>

      {/* COMPLETION METER */}
      <div className="prof-section">
        <div className="completion-card">
          <div className="completion-text">
            <div className="completion-label">Perfil completo</div>
            <div className="completion-num"><span className="completion-big">{p.completion}</span>%</div>
            <div className="completion-hint">Adiciona portfólio pra chegar em 100</div>
          </div>
          <div className="completion-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(14,9,19,0.08)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={palette.primary} strokeWidth="8"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - p.completion / 100)}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div className="completion-emoji">💜</div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="prof-section">
        <div className="stats-grid">
          <StatCard icon={<ProfIcons.Flame size={18} fill="#FF6B35"/>} value={p.stats.streak} label="dias seguidos" tone="orange"/>
          <StatCard icon={<ProfIcons.Sparkle size={18} fill={palette.primary}/>} value={p.stats.matches + matchedToday} label="matches" tone="purple"/>
          <StatCard icon={<ProfIcons.Heart size={18} fill={palette.accent}/>} value={p.stats.applies} label="candidaturas" tone="pink"/>
          <StatCard icon={<ProfIcons.Chat size={18} stroke="#1A8F5C" sw={2.4}/>} value={p.stats.interviews} label="entrevistas" tone="green"/>
        </div>
      </div>

      {/* BIO */}
      <div className="prof-section">
        <h3 className="section-h">Sobre</h3>
        <p className="prof-bio">{p.bio}</p>
      </div>

      {/* SKILLS */}
      <div className="prof-section">
        <h3 className="section-h">Skills <span className="section-h-sub">{p.skills.length}</span></h3>
        <div className="skills-flex">
          {p.skills.map((s) => (
            <span key={s.label} className={`pf-skill pf-skill-${s.level.replace(/\s|ç|á/g, '-')}`}>
              <span>{s.label}</span>
              <span className="pf-skill-level">{s.level}</span>
            </span>
          ))}
        </div>
      </div>

      {/* EXPERIENCE TIMELINE */}
      <div className="prof-section">
        <h3 className="section-h">Experiência</h3>
        <div className="exp-list">
          {p.experience.map((e, i) => (
            <div key={i} className="exp-item">
              <div className="exp-logo" style={{ background: e.brand }}>
                {e.company[0]}
              </div>
              <div className="exp-info">
                <div className="exp-role">{e.role}</div>
                <div className="exp-company">{e.company}</div>
                <div className="exp-meta">
                  <span className="exp-period">{e.period}</span>
                  <span className="exp-dot">•</span>
                  <span>{e.where}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PREFERENCES */}
      <div className="prof-section">
        <h3 className="section-h">Preferências de vaga</h3>
        <div className="pref-card">
          <PrefRow label="Salário desejado" value={p.preferences.salary} highlight/>
          <PrefRow label="Modalidade" value={p.preferences.modes.join(' / ')}/>
          <PrefRow label="Contrato" value={p.preferences.contract.join(' / ')}/>
          <PrefRow label="Nível" value={p.preferences.type}/>
          <PrefRow label="Setores" value={p.preferences.industries.join(', ')}/>
        </div>
      </div>

      {/* SETTINGS LINK */}
      <div className="prof-section prof-section-last">
        <button className="settings-link">
          <span>Configurações & privacidade</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(14,9,19,0.4)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <button className="logout-btn">sair da conta</button>
        <p className="prof-footer">Find.er v0.4 · feito com 💜 em SP</p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, tone }) {
  return (
    <div className={`stat-card stat-tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PrefRow({ label, value, highlight }) {
  return (
    <div className="pref-row">
      <span className="pref-label">{label}</span>
      <span className={`pref-value ${highlight ? 'pref-value-hl' : ''}`}>{value}</span>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
