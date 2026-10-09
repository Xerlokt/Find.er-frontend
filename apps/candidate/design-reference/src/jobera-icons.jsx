// Jobera icons — minimal stroke SVGs, all 24x24 by default
const I = {
  Heart: ({ size = 24, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 21s-7-4.5-9.5-9.5C.8 7.8 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.7 3.8 4 7.5C19 16.5 12 21 12 21z"/>
    </svg>
  ),
  Plane: ({ size = 24, fill = 'currentColor', stroke }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L2 10l8 3 3 8 9-19z" fill={fill} stroke={stroke || fill} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M22 2L10 13" stroke={stroke ? '#fff' : 'rgba(0,0,0,0.18)'} strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  X: ({ size = 24, stroke = 'currentColor', sw = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Star: ({ size = 24, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.5 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z"/>
    </svg>
  ),
  Bolt: ({ size = 24, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>
  ),
  Pin: ({ size = 16, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  Clock: ({ size = 14, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  ),
  Home: ({ size = 24, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/>
    </svg>
  ),
  HomeOutline: ({ size = 24, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/>
    </svg>
  ),
  Chat: ({ size = 24, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
      <path d="M21 15a3 3 0 01-3 3H8l-5 4V6a3 3 0 013-3h12a3 3 0 013 3v9z"/>
    </svg>
  ),
  User: ({ size = 24, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
    </svg>
  ),
  Sliders: ({ size = 18, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M20 18h0"/>
      <circle cx="16" cy="6" r="2" fill={stroke}/>
      <circle cx="8" cy="12" r="2" fill={stroke}/>
      <circle cx="17" cy="18" r="2" fill={stroke}/>
    </svg>
  ),
  Money: ({ size = 16, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <rect x="3" y="6" width="18" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2.5"/>
    </svg>
  ),
  Wifi: ({ size = 16, stroke = 'currentColor', sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <path d="M2 9c5.5-5.5 14.5-5.5 20 0M5 12.5c4-4 10-4 14 0M8.5 16c2-2 5-2 7 0"/>
      <circle cx="12" cy="19.5" r="1.2" fill={stroke}/>
    </svg>
  ),
  Sparkle: ({ size = 16, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z"/>
    </svg>
  ),
  Flame: ({ size = 16, fill = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 1-5-2 1-4 3-4 7a7 7 0 1014 0c0-5-4-7-7-11z"/>
    </svg>
  ),
};

window.JoberaIcons = I;
