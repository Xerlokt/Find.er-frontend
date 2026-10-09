import { Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProfileForm } from '../../src/components/ProfileForm';
import { Wordmark } from '../../src/components/Wordmark';
import { logout } from '../../src/api/auth';
import { useOnboarding } from '../../src/store/onboarding';
import { colors, fonts, ink, layout } from '../../src/theme';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const setPendingDisc = useOnboarding((s) => s.setPendingDisc);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: layout.gutter, paddingTop: 24, gap: 28 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Wordmark size={30} />
            <Pressable onPress={logout}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: ink(0.5) }}>sair</Text>
            </Pressable>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 34, letterSpacing: -1, color: colors.ink }}>
              monta teu perfil<Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6) }}>
              com isso a gente calcula o match das vagas pra você ✨
            </Text>
          </View>
          <ProfileForm
            submitLabel="salvar e continuar"
            onSaved={() => {
              // o perfil já está no cache; abre o DISC opcional antes de liberar o app
              setPendingDisc(true);
              router.replace('/disc');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
