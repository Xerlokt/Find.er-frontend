import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotice } from '../store/notice';
import { brandColor, initialOf } from '../lib/format';
import { colors, fonts, ink, radius, shadow } from '../theme';

export const NOTICE_MS = 4500;

/** Banner no topo quando chega mensagem da empresa com o app aberto; some sozinho, toque abre a conversa. */
export function InAppNotice() {
  const notice = useNotice((s) => s.current);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => useNotice.getState().dismiss(notice.id), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice) return null;

  return (
    <Animated.View
      key={notice.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`nova mensagem de ${notice.title}`}
        onPress={() => {
          useNotice.getState().dismiss(notice.id);
          router.push({ pathname: '/conversa/[id]', params: { id: notice.chatId } });
        }}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.white,
            borderRadius: radius.panel,
            borderWidth: 1,
            borderColor: ink(0.08),
            padding: 12,
          },
          shadow.card,
        ]}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: brandColor(notice.title), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.white }}>{initialOf(notice.title)}</Text>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
            {notice.title}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 13, color: ink(0.7) }}>
            {notice.body}
          </Text>
        </View>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
      </Pressable>
    </Animated.View>
  );
}
