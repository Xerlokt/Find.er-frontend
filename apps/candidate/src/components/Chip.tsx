import { Pressable, Text } from 'react-native';
import { colors, fonts, ink, radius } from '../theme';

type Props = { label: string; selected?: boolean; onPress?: () => void };

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        borderRadius: radius.pill,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderWidth: 1.5,
        borderColor: selected ? colors.ink : ink(0.1),
        backgroundColor: selected ? colors.ink : colors.white,
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: selected ? colors.white : colors.ink }}>{label}</Text>
    </Pressable>
  );
}
