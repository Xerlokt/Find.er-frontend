import { Stack } from 'expo-router';
import { useProfile } from '../../src/api/hooks';
import { onboardingInitialRoute } from '../../src/lib/routes';
import { colors } from '../../src/theme';

export default function OnboardingLayout() {
  const { data: profile } = useProfile();
  return (
    <Stack
      initialRouteName={onboardingInitialRoute(!!profile)}
      screenOptions={{ headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: colors.bg } }}
    />
  );
}
