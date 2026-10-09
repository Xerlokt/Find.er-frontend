import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, ink, layout } from '../theme';
import { Wordmark } from './Wordmark';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: layout.gutter, paddingTop: 24, gap: 28, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Wordmark size={30} />
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 34, letterSpacing: -1, color: colors.ink }}>
              {title}
              <Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6) }}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
