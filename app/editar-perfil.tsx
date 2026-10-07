import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Loading } from '../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '../src/api/hooks';
import { ProfileForm } from '../src/components/ProfileForm';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { colors, fonts, ink, layout } from '../src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: layout.gutter, paddingTop: 12, gap: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ScreenTitle>editar perfil</ScreenTitle>
            <Pressable onPress={back} hitSlop={12}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: ink(0.5) }}>cancelar</Text>
            </Pressable>
          </View>
          {profile ? (
            <ProfileForm initial={profile} submitLabel="salvar alterações" onSaved={back} />
          ) : (
            <Loading logo={false} inline />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
