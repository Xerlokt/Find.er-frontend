import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CandidateMetrics } from '../../src/api/candidates';
import { useMetrics } from '../../src/api/hooks';
import { Button } from '../../src/components/Button';
import { Loading } from '../../src/components/Loading';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { barRatio, formatLikeRate, insight, maxDay, weekdayLabel } from '../../src/lib/metrics';
import { colors, fonts, ink, layout, radius, shadow } from '../../src/theme';

const CHART_HEIGHT = 96;

function Stat({ value, label, tone }: { value: string | number; label: string; tone?: 'lime' }) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        backgroundColor: tone === 'lime' ? colors.lime : colors.white,
        borderRadius: radius.panel,
        padding: 16,
        ...shadow.soft,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.ink, letterSpacing: -0.6 }}>{value}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ink(0.6) }}>{label}</Text>
    </View>
  );
}

function WeekChart({ days }: { days: CandidateMetrics['last7Days'] }) {
  const max = maxDay(days);
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.panel, padding: 16, gap: 10, ...shadow.soft }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>últimos 7 dias</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: 8 }}>
        {days.map((d) => {
          const likeH = barRatio(d.likes, max) * CHART_HEIGHT;
          const dislikeH = barRatio(d.dislikes, max) * CHART_HEIGHT;
          return (
            <View key={d.date} style={{ flex: 1, justifyContent: 'flex-end' }} accessibilityLabel={`${weekdayLabel(d.date)}: ${d.likes} likes, ${d.dislikes} dislikes`}>
              <View style={{ height: dislikeH, backgroundColor: ink(0.25), borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              <View
                style={{
                  height: likeH,
                  backgroundColor: colors.accent,
                  borderTopLeftRadius: dislikeH === 0 ? 4 : 0,
                  borderTopRightRadius: dislikeH === 0 ? 4 : 0,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {days.map((d) => (
          <Text key={d.date} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.mono, fontSize: 11, color: ink(0.5) }}>
            {weekdayLabel(d.date)}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Legend color={colors.accent} label="likes" />
        <Legend color={ink(0.25)} label="dislikes" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.6) }}>{label}</Text>
    </View>
  );
}

export default function MetricsScreen() {
  const router = useRouter();
  const metrics = useMetrics();
  const m = metrics.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 12, paddingHorizontal: layout.gutter }}>
        <ScreenTitle>Métricas</ScreenTitle>
      </View>

      {metrics.isLoading ? (
        <Loading logo={false} />
      ) : !m ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: layout.gutter }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6), textAlign: 'center' }}>
            não foi possível carregar suas métricas.
          </Text>
          <Button label="tentar de novo" onPress={() => metrics.refetch()} loading={metrics.isFetching} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: layout.gutter, gap: 14 }}
          refreshControl={<RefreshControl refreshing={metrics.isRefetching} onRefresh={() => metrics.refetch()} tintColor={colors.primary} />}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.7) }}>{insight(m)}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Stat value={m.swipes.total} label="vagas avaliadas" />
            <Stat value={formatLikeRate(m.swipes.likeRate)} label="taxa de like" />
            <Stat value={m.swipes.likes} label="likes" />
            <Stat value={m.swipes.dislikes} label="dislikes" />
          </View>

          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>conversas</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Stat value={m.chats.total} label="conversas abertas" />
            <Stat value={m.chats.viaMatch} label="por match (você curtiu)" />
            <Stat value={m.companiesUnlockedYou} label="empresas que pagaram para falar com você" tone="lime" />
          </View>

          <WeekChart days={m.last7Days} />

          {m.discDominant && (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.panel, padding: 16, gap: 10, ...shadow.soft }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                seu perfil DISC: <Text style={{ color: colors.primary }}>{m.discDominant}</Text>
              </Text>
              <Button label="refazer teste" variant="ghost" onPress={() => router.push('/refazer-disc')} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
