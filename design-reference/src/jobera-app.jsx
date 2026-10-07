// Jobera main app — top bar, swipe stack, action buttons, bottom nav, match popup, tweaks
const { useState, useEffect, useRef, useMemo } = React;
const Icons = window.JoberaIcons;
const JOBS = window.JOBERA_JOBS;

const PALETTES = {
  electric: { name: 'Electric', primary: '#6C4DF6', accent: '#FF4D8F', lime: '#D8FF4A', bg: '#F4EFE6', ink: '#0E0913' },
  cyber:    { name: 'Cyber',    primary: '#0E0913', accent: '#D8FF4A', lime: '#FF4D8F', bg: '#F4EFE6', ink: '#0E0913' },
  miami:    { name: 'Miami',    primary: '#FF4D8F', accent: '#FF6B35', lime: '#D8FF4A', bg: '#FFE9D6', ink: '#1A0B2E' },
  noir:     { name: 'Noir',     primary: '#0E0913', accent: '#FF4D8F', lime: '#D8FF4A', bg: '#FFFEEA', ink: '#0E0913' },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "electric",
  "showStreak": true,
  "showFilters": true,
  "cardLayout": "photo-top"
}/*EDITMODE-END*/;

const FILTERS = [
  { id: 'pra-voce', label: 'Pra você', emoji: '✨' },
  { id: 'tech', label: 'Tech' },
  { id: 'design', label: 'Design' },
  { id: 'remoto', label: 'Remoto' },
  { id: 'sp', label: 'São Paulo' },
  { id: 'estagio', label: 'Estágio' },
  { id: 'pj', label: 'PJ' },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[t.palette] || PALETTES.electric;

  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null
  const [matchModal, setMatchModal] = useState(null);
  const [matchedToday, setMatchedToday] = useState(0);
  const [activeFilter, setActiveFilter] = useState('pra-voce');
  const [activeTab, setActiveTab] = useState('home');
  const DAILY_LIMIT = 30;
  const [swipesUsed, setSwipesUsed] = useState(0);

  const startRef = useRef({ x: 0, y: 0 });
  const cycledJobs = useMemo(() => {
    // Loop the deck so it never empties
    const out = [];
    for (let i = 0; i < 12; i++) out.push({ ...JOBS[i % JOBS.length], _k: i });
    return out;
  }, []);

  const stack = cycledJobs.slice(index, index + 3);

  // Inject palette as CSS vars
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--c-primary', palette.primary);
    root.style.setProperty('--c-accent', palette.accent);
    root.style.setProperty('--c-lime', palette.lime);
    root.style.setProperty('--c-bg', palette.bg);
    root.style.setProperty('--c-ink', palette.ink);
  }, [palette]);

  // ── Swipe handlers ─────────────────────────────────────────
  const onPointerDown = (e) => {
    if (exiting) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y });
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (drag.x > 110) commit('right');
    else if (drag.x < -110) commit('left');
    else setDrag({ x: 0, y: 0 });
  };

  const commit = (dir) => {
    setExiting(dir);
    setSwipesUsed((n) => Math.min(DAILY_LIMIT, n + 1));
    const job = cycledJobs[index];
    setTimeout(() => {
      if (dir === 'right') {
        setMatchedToday((n) => n + 1);
        setMatchModal(job);
      }
      setIndex((i) => i + 1);
      setExiting(null);
      setDrag({ x: 0, y: 0 });
    }, 380);
  };

  // ── Render ─────────────────────────────────────────────────
  const ProfileScreen = window.ProfileScreen;
  const ChatScreen = window.ChatScreen;
  return (
    <div className="jobera-root" data-screen-label={`Tab: ${activeTab}`}>
      {activeTab === 'profile' && ProfileScreen ? (
        <ProfileScreen palette={palette} matchedToday={matchedToday}/>
      ) : activeTab === 'chat' && ChatScreen ? (
        <ChatScreen palette={palette}/>
      ) : activeTab === 'metrics' ? (
        <MetricsScreen palette={palette} swipesUsed={swipesUsed} dailyLimit={DAILY_LIMIT} matchedToday={matchedToday}/>
      ) : activeTab !== 'home' ? (
        <PlaceholderScreen tab={activeTab} palette={palette}/>
      ) : (
        <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <span className="brand-mark">Find<span className="brand-dot">.</span>er</span>
          </div>
          <div className="topbar-stats">
            {t.showStreak && (
              <div className="stat-pill stat-streak">
                <Icons.Flame size={13} fill="#FF6B35"/>
                <span>7</span>
              </div>
            )}
            <div className="stat-pill stat-matches">
              <Icons.Sparkle size={13} fill={palette.primary}/>
              <span>{matchedToday}</span>
            </div>
            <button className="topbar-btn" aria-label="Filtros">
              <Icons.Sliders size={16} stroke={palette.ink} sw={2.2}/>
            </button>
          </div>
        </div>


        {t.showFilters && (
          <div className="filter-scroller">
            <div className="filter-track">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.emoji && <span style={{ marginRight: 4 }}>{f.emoji}</span>}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DAILY SWIPE LIMIT BAR — minimal, below filter chips */}
        <DailyLimitBar used={swipesUsed} total={DAILY_LIMIT} primary={palette.primary} accent={palette.accent}/>
      </div>

      {/* CARD STACK */}
      <div className="stack-area">
        <div
          className="stack"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {stack.length === 0 && (
            <div className="empty-state">
              <p>Acabou por hoje! 💜</p>
              <button onClick={() => setIndex(0)} className="restart-btn">Recomeçar</button>
            </div>
          )}
          {[...stack].reverse().map((job, i) => {
            const depth = stack.length - 1 - i;
            const isTop = depth === 0;
            return (
              <JobCard
                key={job._k}
                job={job}
                drag={drag}
                isDragging={isDragging}
                exiting={isTop ? exiting : null}
                isTop={isTop}
                depth={depth}
              />
            );
          })}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-bar">
        <button
          className="action-btn action-pass"
          onClick={() => commit('left')}
          aria-label="Passar"
        >
          <Icons.X size={28} stroke="#0E0913" sw={3}/>
        </button>
        <button
          className="action-btn action-super"
          aria-label="Salvar"
        >
          <Icons.Star size={22} fill={palette.primary}/>
        </button>
        <button
          className="action-btn action-like"
          onClick={() => commit('right')}
          aria-label="Candidatar"
        >
          <Icons.Plane size={28} fill="#fff"/>
        </button>
      </div>

        </>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <NavItem id="home" label="Home" icon={<Icons.HomeOutline size={22} sw={2.2} stroke={activeTab === 'home' ? palette.primary : 'rgba(14,9,19,0.5)'}/>} active={activeTab === 'home'} onClick={() => setActiveTab('home')} primary={palette.primary}/>
        <NavItem id="metrics" label="Metrics" icon={<Icons.Bolt size={22} fill={activeTab === 'metrics' ? palette.accent : 'rgba(14,9,19,0.5)'}/>} active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} primary={palette.accent}/>
        <NavItem id="chat" label="Chat" icon={<Icons.Chat size={22} sw={2.2} stroke={activeTab === 'chat' ? palette.primary : 'rgba(14,9,19,0.5)'}/>} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} primary={palette.primary}/>
        <NavItem id="profile" label="Perfil" icon={<Icons.User size={22} sw={2.2} stroke={activeTab === 'profile' ? palette.primary : 'rgba(14,9,19,0.5)'}/>} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} primary={palette.primary}/>
      </div>

      {/* MATCH POPUP */}
      {matchModal && (
        <MatchPopup job={matchModal} onClose={() => setMatchModal(null)} primary={palette.primary} accent={palette.accent}/>
      )}

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Estilo"/>
        <TweakSelect label="Paleta" value={t.palette} options={Object.keys(PALETTES).map(k => ({ value: k, label: PALETTES[k].name }))} onChange={(v) => setTweak('palette', v)}/>
        <TweakSection label="Layout"/>
        <TweakToggle label="Streak (🔥7)" value={t.showStreak} onChange={(v) => setTweak('showStreak', v)}/>
        <TweakToggle label="Filtros (chips)" value={t.showFilters} onChange={(v) => setTweak('showFilters', v)}/>
        <TweakSection label="Ações"/>
        <TweakButton label="Reset deck" onClick={() => { setIndex(0); setMatchedToday(0); }} secondary/>
      </TweaksPanel>
    </div>
  );
}

function PlaceholderScreen({ tab, palette }) {
  const labels = { matches: 'Matches', chat: 'Chat' };
  const subs = {
    matches: 'aqui ficam as vagas que deram match com você',
    chat: 'conversas com recrutadores das empresas que deram match',
  };
  return (
    <div className="placeholder-screen" data-screen-label={`Placeholder: ${tab}`}>
      <div className="placeholder-glyph" style={{ background: palette.primary }}>
        {tab === 'matches' ? '♥' : '✦'}
      </div>
      <h2 className="placeholder-title">{labels[tab] || tab}</h2>
      <p className="placeholder-sub">{subs[tab] || 'em breve'}</p>
      <span className="placeholder-tag">EM BREVE</span>
    </div>
  );
}

function DailyLimitBar({ used, total, primary, accent }) {
  const pct = Math.min(100, (used / total) * 100);
  const left = total - used;
  const lowish = left <= 5;
  return (
    <div className="limit-bar-mini">
      <div className="limit-bar-track">
        <div className="limit-bar-fill"
             style={{ width: `${pct}%`, background: lowish ? accent : primary }}/>
      </div>
      <div className="limit-bar-meta">
        <span className="limit-bar-label">swipes hoje</span>
        <span className="limit-bar-count" style={lowish ? { color: accent } : {}}>
          <b>{used}</b><span className="limit-bar-sep">/</span>{total}
        </span>
      </div>
    </div>
  );
}

function MetricsScreen({ palette, swipesUsed, dailyLimit, matchedToday }) {
  const m = {
    profileViews: 184,
    profileViewsDelta: '+24%',
    appliesWeek: 28,
    appliesWeekDelta: '+12%',
    responseRate: 41,
    responseRateDelta: '+8pp',
    matches: 23 + matchedToday,
    funnel: [
      { label: 'cards vistos', value: 412, pct: 100 },
      { label: 'rolei', value: 142, pct: 34 },
      { label: 'matches', value: 23 + matchedToday, pct: 16 },
      { label: 'entrevistas', value: 5, pct: 22 },
      { label: 'ofertas', value: 1, pct: 20 },
    ],
    bars: [42, 28, 65, 48, 72, 58, 82],
    days: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
    topSkills: [
      { label: 'Figma', score: 96 },
      { label: 'Design System', score: 88 },
      { label: 'User Research', score: 71 },
    ],
  };
  const max = Math.max(...m.bars);
  return (
    <div className="metrics-root" data-screen-label="Metrics">
      <div className="metrics-header">
        <h1 className="metrics-title">Metrics<span style={{ color: palette.accent }}>.</span></h1>
        <div className="metrics-period">últimos 7 dias</div>
      </div>

      {/* TODAY CARD */}
      <div className="metrics-today" style={{ background: palette.ink }}>
        <div className="today-label">hoje</div>
        <div className="today-row">
          <div className="today-stat">
            <div className="today-num">{swipesUsed}</div>
            <div className="today-cap">swipes</div>
          </div>
          <div className="today-divider"/>
          <div className="today-stat">
            <div className="today-num" style={{ color: palette.lime }}>{matchedToday}</div>
            <div className="today-cap">matches</div>
          </div>
          <div className="today-divider"/>
          <div className="today-stat">
            <div className="today-num">{dailyLimit - swipesUsed}</div>
            <div className="today-cap">restam</div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <KpiCard label="visitas no perfil" value={m.profileViews} delta={m.profileViewsDelta} accent={palette.primary}/>
        <KpiCard label="candidaturas" value={m.appliesWeek} delta={m.appliesWeekDelta} accent={palette.accent}/>
        <KpiCard label="taxa de resposta" value={`${m.responseRate}%`} delta={m.responseRateDelta} accent="#1A8F5C"/>
        <KpiCard label="matches" value={m.matches} delta="+3" accent="#FF6B35"/>
      </div>

      {/* CHART */}
      <div className="metrics-section">
        <div className="metrics-section-h">
          <span>atividade da semana</span>
          <span className="metrics-h-sub">swipes / dia</span>
        </div>
        <div className="bars-card">
          <div className="bars-row">
            {m.bars.map((b, i) => (
              <div key={i} className="bar-col">
                <div className="bar-val">{b}</div>
                <div className="bar-track">
                  <div className="bar-fill"
                       style={{
                         height: `${(b/max)*100}%`,
                         background: i === m.bars.length - 1 ? palette.accent : palette.primary
                       }}/>
                </div>
                <div className="bar-day">{m.days[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FUNNEL */}
      <div className="metrics-section">
        <div className="metrics-section-h">
          <span>seu funil</span>
          <span className="metrics-h-sub">desde que entrou</span>
        </div>
        <div className="funnel-card">
          {m.funnel.map((f, i) => (
            <div key={i} className="funnel-row">
              <div className="funnel-info">
                <span className="funnel-label">{f.label}</span>
                <span className="funnel-value">{f.value}</span>
              </div>
              <div className="funnel-track">
                <div className="funnel-fill"
                     style={{
                       width: `${f.pct}%`,
                       background: i === 0 ? 'rgba(14,9,19,0.15)' : palette.primary,
                       opacity: 1 - i * 0.12
                     }}/>
              </div>
              {i < m.funnel.length - 1 && (
                <div className="funnel-conv">↓ {Math.round((m.funnel[i+1].value / f.value) * 100)}% converteu</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TOP SKILLS */}
      <div className="metrics-section">
        <div className="metrics-section-h">
          <span>skills que tão bombando</span>
          <span className="metrics-h-sub">no teu perfil</span>
        </div>
        <div className="skill-bars">
          {m.topSkills.map((s) => (
            <div key={s.label} className="skill-bar-row">
              <div className="skill-bar-info">
                <span className="skill-bar-label">{s.label}</span>
                <span className="skill-bar-score">{s.score}</span>
              </div>
              <div className="skill-bar-track">
                <div className="skill-bar-fill" style={{ width: `${s.score}%`, background: palette.lime }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-footer">
        <span>📊 atualiza toda madrugada</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, accent }) {
  const positive = delta.startsWith('+');
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${positive ? 'kpi-delta-up' : 'kpi-delta-down'}`} style={{ color: positive ? '#1A8F5C' : '#FF3B30' }}>
        {positive ? '↗' : '↘'} {delta}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, primary, badge }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="nav-icon-wrap">
        {icon}
        {badge && <span className="nav-badge" style={{ background: primary }}>{badge}</span>}
      </div>
      <span className="nav-label" style={active ? { color: primary, fontWeight: 600 } : {}}>{label}</span>
    </button>
  );
}

function MatchPopup({ job, onClose, primary, accent }) {
  return (
    <div className="match-overlay" onClick={onClose}>
      <div className="match-card" onClick={(e) => e.stopPropagation()}>
        <div className="match-burst">
          <div className="match-burst-bg" style={{ background: job.photoBg }}/>
          <div className="match-headline">
            <span className="match-bigword" style={{ color: '#FFF' }}>É MATCH!</span>
            <span className="match-sub">você e <b>{job.company}</b> deram like</span>
          </div>
        </div>
        <div className="match-body">
          <p className="match-job">{job.title}</p>
          <div className="match-actions">
            <button className="match-cta" style={{ background: primary }} onClick={onClose}>
              Ver vaga completa
            </button>
            <button className="match-secondary" onClick={onClose}>
              Continuar swipando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.JoberaApp = App;
