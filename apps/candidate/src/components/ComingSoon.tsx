import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, ink, layout, radius } from '../theme';
import { ScreenTitle } from './ScreenTitle';

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: layout.gutter }}>
      <View style={{ paddingTop: 12 }}>
        <ScreenTitle>{title}</ScreenTitle>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <View style={{ backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink, letterSpacing: 1 }}>EM BREVE</Text>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6), textAlign: 'center', maxWidth: 260 }}>
          {note ?? 'essa parte ainda tá no forno 💜'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
