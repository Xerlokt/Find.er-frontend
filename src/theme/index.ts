export const colors = {
  primary: '#6C4DF6',
  accent: '#FF4D8F',
  lime: '#D8FF4A',
  bg: '#F4EFE6',
  ink: '#0E0913',
  white: '#FFFFFF',
  success: '#1A8F5C',
  successText: '#10703D',
  danger: '#FF3B30',
  streak: '#FF6B35',
} as const;

/** ink com opacidade, usado para textos secundários e bordas */
export const ink = (alpha: number) => `rgba(14,9,19,${alpha})`;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const radius = { card: 28, panel: 20, small: 10, pill: 999 } as const;

export const layout = { gutter: 18 } as const;

export const shadow = {
  card: {
    shadowColor: '#0E0913',
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
  soft: {
    shadowColor: '#0E0913',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;
