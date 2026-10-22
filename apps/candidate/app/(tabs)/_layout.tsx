import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { colors, fonts, ink } from '../../src/theme';
import { Bolt, Chat, Home, HomeOutline, User } from '../../src/components/icons';
import { useUnreadChats } from '../../src/api/chatHooks';
import { badgeLabel } from '../../src/lib/unread';

export default function TabsLayout() {
  const unread = useUnreadChats();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: ink(0.45),
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
        tabBarStyle: {
          backgroundColor: 'rgba(244,239,230,0.96)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: ink(0.1),
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) =>
            focused ? <Home color={String(color)} size={24} /> : <HomeOutline color={String(color)} size={24} />,
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: 'Métricas',
          tabBarActiveTintColor: colors.accent,
          tabBarIcon: ({ color }) => <Bolt color={String(color)} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: badgeLabel(unread),
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.white, fontFamily: fonts.monoBold, fontSize: 10 },
          tabBarIcon: ({ color }) => <Chat color={String(color)} size={24} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User color={String(color)} size={24} /> }}
      />
    </Tabs>
  );
}

