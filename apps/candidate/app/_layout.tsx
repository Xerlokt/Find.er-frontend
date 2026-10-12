import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, Text, View } from 'react-native';
import { Loading } from '../src/components/Loading';
import { colors, fonts } from '../src/theme';
import { logout, restoreSession } from '../src/api/auth';
import { friendlyMessage } from '../src/api/errors';
import { useProfile } from '../src/api/hooks';
import { usePushNotifications } from '../src/api/usePushNotifications';
import { useLiveInbox } from '../src/api/liveInbox';
import { InAppNotice } from '../src/components/InAppNotice';
import { useSession } from '../src/store/session';
import { useChatSeen } from '../src/store/chatSeen';
import { useOnboarding } from '../src/store/onboarding';
import { Button } from '../src/components/Button';
import { Wordmark } from '../src/components/Wordmark';
import { resolveRoute, type ProfileStatus } from '../src/lib/routes';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const [sessionReady, setSessionReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const signedIn = useSession((s) => !!s.accessToken);
  const hasSavedSession = useSession((s) => !!s.refreshToken); // "sair" na tela offline apaga e libera o login

  const restore = useCallback(async () => {
    setRetrying(true);
    try {
      setOffline((await restoreSession()) === 'offline');
    } catch {
      setOffline(false);
    } finally {
      setRetrying(false);
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    restore();
    useChatSeen.getState().hydrate();
  }, [restore]);

  // Ao deslogar (manual ou refresh expirado) descarta qualquer dado do usuário anterior
  useEffect(() => {
    if (!signedIn) queryClient.clear();
  }, [signedIn]);

  // o React Query não enxerga o app em segundo plano no RN: sem isso o polling do chat não pausa nem atualiza ao voltar
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
    return () => sub.remove();
  }, []);

  const ready = fontsLoaded && sessionReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <RootNavigator signedIn={signedIn} offline={offline && hasSavedSession}retrying={retrying} onRetry={restore} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({
  signedIn,
  offline,
  retrying,
  onRetry,
}: {
  signedIn: boolean;
  offline: boolean;
  retrying: boolean;
  onRetry: () => void;
}) {
  const emailVerified = useSession((s) => s.emailVerified);
  const active = signedIn && emailVerified; // só chama a API protegida depois de validar o email
  usePushNotifications(active);
  useLiveInbox(active);
  const profileQuery = useProfile(active);
  const pendingDisc = useOnboarding((s) => s.pendingDisc);
  const setPendingDisc = useOnboarding((s) => s.setPendingDisc);

  useEffect(() => {
    if (!signedIn) setPendingDisc(false);
  }, [signedIn, setPendingDisc]);

  const profileStatus: ProfileStatus = profileQuery.isPending
    ? 'pending'
    : profileQuery.isError
      ? 'error'
      : profileQuery.data
        ? 'ready'
        : 'missing';
  const route = resolveRoute({ signedIn, emailVerified, offline, profile: profileStatus, pendingDisc });

  // Sessão salva, mas o servidor não respondeu no boot: não é logout, então não mostra o login.
  if (route === 'offline') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, backgroundColor: colors.bg }}>
        <Wordmark size={56} />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center', marginBottom: 8 }}>
          sem conexão com o servidor. sua conta continua salva, é só tentar de novo.
        </Text>
        <Button label={retrying ? 'tentando…' : 'tentar de novo'} onPress={onRetry} disabled={retrying} style={{ alignSelf: 'stretch' }} />
        <Button label="sair" variant="ghost" onPress={logout} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  // Logado, mas ainda sem saber se existe perfil (ou a consulta falhou): não dá pra escolher a rota.
  if (route === 'loading') {
    return <Loading />;
  }
  if (route === 'error') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
          {friendlyMessage(profileQuery.error)}
        </Text>
        <Button label="tentar de novo" onPress={() => profileQuery.refetch()} style={{ alignSelf: 'stretch' }} />
        <Button label="sair" variant="ghost" onPress={logout} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const onboarding = route === 'onboarding';

  return (
    <>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={route === 'auth'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'verify-email'}>
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
      <Stack.Protected guard={onboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'app'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="conversa/[id]" />
        <Stack.Screen name="empresa/[chatId]" />
        <Stack.Screen name="editar-perfil" />
        <Stack.Screen name="refazer-disc" />
      </Stack.Protected>
    </Stack>
    <InAppNotice />
    </>
  );
}
