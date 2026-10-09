// Jobera Chat — list of conversations + detail thread
const ChatIcons = window.JoberaIcons;

const CONVERSATIONS = [
  {
    id: 'lumi',
    company: 'lumi.',
    initial: 'L',
    brandColor: '#FF4D8F',
    photoBg: 'radial-gradient(circle at 30% 20%, #FFB3D1 0%, #FF4D8F 40%, #6C4DF6 100%)',
    recruiter: 'Bia, recrutadora',
    role: 'Product Designer Pleno',
    lastMessage: 'oi! adoramos teu portfólio, bora marcar um papo?',
    lastTime: 'agora',
    unread: 2,
    online: true,
    typing: false,
    isNew: true,
    messages: [
      { from: 'them', text: 'opaa Maria, é match! 💜', time: '10:42' },
      { from: 'them', text: 'eu sou a Bia, lidero o time de design aqui na lumi.', time: '10:42' },
      { from: 'them', text: 'oi! adoramos teu portfólio, bora marcar um papo?', time: '10:43' },
    ],
  },
  {
    id: 'rivo',
    company: 'rivo.',
    initial: 'R',
    brandColor: '#6C4DF6',
    photoBg: 'linear-gradient(135deg, #D8FF4A 0%, #6C4DF6 50%, #1A0B2E 100%)',
    recruiter: 'João, eng manager',
    role: 'Software Engineer FE',
    lastMessage: 'você tá disponível pra um pair na quinta?',
    lastTime: '14h',
    unread: 1,
    online: false,
    typing: false,
    messages: [
      { from: 'me', text: 'oi João! tudo certo, obrigada pelo retorno', time: 'ontem 18:20' },
      { from: 'them', text: 'tranquilo! a gente faz uma conversa rápida + um pair de 45min', time: 'ontem 19:05' },
      { from: 'them', text: 'você tá disponível pra um pair na quinta?', time: '14h' },
    ],
  },
  {
    id: 'boto',
    company: 'boto.',
    initial: 'B',
    brandColor: '#0E0913',
    photoBg: 'linear-gradient(160deg, #FF4D8F 0%, #FFB3D1 30%, #D8FF4A 100%)',
    recruiter: 'Carla, founder',
    role: 'Social Media Manager',
    lastMessage: 'top! te mandei o link do brief amanhã 🌸',
    lastTime: 'ontem',
    unread: 0,
    online: true,
    typing: true,
    messages: [
      { from: 'them', text: 'oiiii Maria, eu sou a Carla, founder da boto', time: 'ontem' },
      { from: 'me', text: 'oi Carla, super tô a fim de conversar', time: 'ontem' },
      { from: 'them', text: 'top! te mandei o link do brief amanhã 🌸', time: 'ontem' },
    ],
  },
  {
    id: 'patio',
    company: 'patio.',
    initial: 'P',
    brandColor: '#1A8F5C',
    photoBg: 'linear-gradient(200deg, #1A8F5C 0%, #D8FF4A 70%, #FFFEEA 100%)',
    recruiter: 'Pedro, head of data',
    role: 'Data Analyst Júnior',
    lastMessage: 'recebido! vou ver com o time e te respondo até sexta',
    lastTime: '2d',
    unread: 0,
    online: false,
    typing: false,
    messages: [
      { from: 'them', text: 'Maria, parabéns! teu perfil bateu com a vaga', time: '2d' },
      { from: 'me', text: 'top! quando a gente conversa?', time: '2d' },
      { from: 'them', text: 'recebido! vou ver com o time e te respondo até sexta', time: '2d' },
    ],
  },
  {
    id: 'fome',
    company: 'fome.',
    initial: 'F',
    brandColor: '#FF6B35',
    photoBg: 'linear-gradient(135deg, #FFE9D6 0%, #FF6B35 50%, #6C4DF6 100%)',
    recruiter: 'Tati, design lead',
    role: 'Brand Designer Sênior',
    lastMessage: 'queremos te conhecer melhor, te mando umas referências',
    lastTime: '3d',
    unread: 0,
    online: false,
    typing: false,
    messages: [
      { from: 'them', text: 'queremos te conhecer melhor, te mando umas referências', time: '3d' },
    ],
  },
];

function ChatScreen({ palette }) {
  const [openId, setOpenId] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const open = CONVERSATIONS.find((c) => c.id === openId);

  if (open) {
    return <ChatThread conv={open} palette={palette} onBack={() => setOpenId(null)} draft={draft} setDraft={setDraft}/>;
  }
  return <ChatList palette={palette} onOpen={setOpenId}/>;
}

function ChatList({ palette, onOpen }) {
  const totalUnread = CONVERSATIONS.reduce((n, c) => n + c.unread, 0);
  return (
    <div className="chat-root" data-screen-label="Chat: list">
      {/* HEADER */}
      <div className="chat-header">
        <div className="chat-header-row">
          <h1 className="chat-title">
            chat<span style={{ color: palette.accent }}>.</span>
            <span className="chat-title-brand">Find.er</span>
          </h1>
          <button className="chat-search-btn" aria-label="Buscar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>
            </svg>
          </button>
        </div>
        <p className="chat-subtitle">
          {totalUnread > 0
            ? <>tem <b style={{ color: palette.primary }}>{totalUnread} mensagens novas</b> esperando ✨</>
            : <>tudo em dia 💜</>}
        </p>
      </div>

      {/* NEW MATCHES STRIP */}
      <div className="new-matches-strip">
        <div className="new-matches-label">novos matches</div>
        <div className="new-matches-row">
          {CONVERSATIONS.filter(c => c.isNew).concat(CONVERSATIONS.filter(c => !c.isNew).slice(0, 4)).map((c, i) => (
            <button key={c.id} className="match-bubble" onClick={() => onOpen(c.id)}>
              <div className="match-bubble-avatar" style={{ background: c.photoBg }}>
                <span>{c.initial}</span>
                {c.isNew && <span className="match-bubble-new" style={{ background: palette.accent }}/>}
                {c.online && !c.isNew && <span className="match-bubble-dot"/>}
              </div>
              <span className="match-bubble-name">{c.company}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONVERSATION LIST */}
      <div className="conv-list">
        <div className="conv-list-header">conversas</div>
        {CONVERSATIONS.map((c) => (
          <button key={c.id} className="conv-row" onClick={() => onOpen(c.id)}>
            <div className="conv-avatar" style={{ background: c.photoBg }}>
              <span>{c.initial}</span>
              {c.online && <span className="conv-online-dot"/>}
            </div>
            <div className="conv-body">
              <div className="conv-row-1">
                <span className="conv-company">{c.company}</span>
                <span className="conv-time">{c.lastTime}</span>
              </div>
              <div className="conv-role">{c.role}</div>
              <div className="conv-row-2">
                <span className={`conv-preview ${c.unread > 0 ? 'conv-preview-unread' : ''}`}>
                  {c.typing ? <span className="typing-line" style={{ color: palette.primary }}>digitando…</span> : c.lastMessage}
                </span>
                {c.unread > 0 && (
                  <span className="conv-badge" style={{ background: palette.primary }}>{c.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatThread({ conv, palette, onBack, draft, setDraft }) {
  const [messages, setMessages] = React.useState(conv.messages);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    setMessages((m) => [...m, { from: 'me', text, time }]);
    setDraft('');
  };

  return (
    <div className="thread-root" data-screen-label={`Chat: ${conv.id}`}>
      {/* THREAD HEADER */}
      <div className="thread-header">
        <button className="thread-back" onClick={onBack} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="thread-id">
          <div className="thread-avatar" style={{ background: conv.photoBg }}>
            {conv.initial}
            {conv.online && <span className="thread-online-dot"/>}
          </div>
          <div className="thread-meta">
            <div className="thread-company">{conv.company}</div>
            <div className="thread-recruiter">
              {conv.online ? <span style={{ color: '#1A8F5C' }}>● online</span> : conv.recruiter}
            </div>
          </div>
        </div>
        <button className="thread-action" aria-label="Mais">
          <svg width="20" height="6" viewBox="0 0 22 6">
            <circle cx="3" cy="3" r="2.4" fill={palette.ink}/>
            <circle cx="11" cy="3" r="2.4" fill={palette.ink}/>
            <circle cx="19" cy="3" r="2.4" fill={palette.ink}/>
          </svg>
        </button>
      </div>

      {/* MATCH BANNER */}
      <div className="thread-match-banner">
        <span className="banner-spark">✦</span>
        <span>vocês deram match na vaga de <b>{conv.role}</b></span>
      </div>

      {/* MESSAGES */}
      <div className="thread-scroll" ref={scrollRef}>
        <div className="thread-day">hoje</div>
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row bubble-${m.from}`}>
            {m.from === 'them' && i === 0 && (
              <div className="bubble-avatar" style={{ background: conv.photoBg }}>{conv.initial}</div>
            )}
            {m.from === 'them' && i > 0 && messages[i-1].from !== 'them' && (
              <div className="bubble-avatar" style={{ background: conv.photoBg }}>{conv.initial}</div>
            )}
            {m.from === 'them' && i > 0 && messages[i-1].from === 'them' && (
              <div className="bubble-avatar bubble-avatar-spacer"/>
            )}
            <div className={`bubble bubble-${m.from === 'me' ? 'me' : 'them'}`}
                 style={m.from === 'me' ? { background: palette.primary } : {}}>
              <span className="bubble-text">{m.text}</span>
              <span className="bubble-time">{m.time}</span>
            </div>
          </div>
        ))}
        {conv.typing && (
          <div className="bubble-row bubble-them">
            <div className="bubble-avatar" style={{ background: conv.photoBg }}>{conv.initial}</div>
            <div className="bubble bubble-them bubble-typing">
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
      </div>

      {/* QUICK REPLIES */}
      {messages.length < 5 && (
        <div className="quick-replies">
          {['💜 tô a fim!', 'pode me contar mais?', 'que dia funciona?'].map((q) => (
            <button key={q} className="quick-reply" onClick={() => setDraft(q.replace(/^[^a-zA-Záàâãéêíóôõúç]+/, ''))}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* COMPOSER */}
      <div className="composer">
        <button className="composer-attach" aria-label="Anexo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(14,9,19,0.5)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 11l-9 9a5 5 0 11-7-7l9-9a3.5 3.5 0 115 5l-9 9a2 2 0 11-3-3l8-8"/>
          </svg>
        </button>
        <input
          className="composer-input"
          placeholder="manda uma mensagem…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button
          className="composer-send"
          onClick={send}
          disabled={!draft.trim()}
          style={draft.trim() ? { background: palette.primary, color: '#fff' } : {}}
          aria-label="Enviar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l18-9-7 18-3-7-8-2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

window.ChatScreen = ChatScreen;
