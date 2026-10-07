import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, ink, radius } from '../theme';

type Props = TextInputProps & { label: string; error?: string };

export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, style, ...rest }, ref) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.55), textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={ink(0.35)}
        style={[
          {
            backgroundColor: colors.white,
            borderRadius: radius.panel - 4,
            borderWidth: 1.5,
            borderColor: error ? colors.danger : ink(0.1),
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.ink,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.danger }}>{error}</Text> : null}
    </View>
  );
});
