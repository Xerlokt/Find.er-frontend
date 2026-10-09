import { Text } from 'react-native';
import { colors, fonts } from '../theme';

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: size, color: colors.ink, letterSpacing: -0.03 * size }}>
      Find<Text style={{ color: colors.accent }}>.</Text>er
    </Text>
  );
}
