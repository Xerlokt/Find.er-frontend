import { Text } from 'react-native';
import { colors, fonts } from '../theme';

/** Título de tela do design: texto + ponto rosa ("chat.") */
export function ScreenTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.ink, letterSpacing: -0.9 }}>
      {children}
      <Text style={{ color: colors.accent }}>.</Text>
    </Text>
  );
}
