import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';
import { colors, fonts, ink, radius } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg = variant === 'primary' ? colors.primary : variant === 'accent' ? colors.accent : 'transparent';
  const fg = variant === 'ghost' ? ink(0.7) : colors.white;
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: fg }}>{label}</Text>
      )}
    </Pressable>
  );
}
