import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { friendlyMessage } from '../../src/api/errors';
import { feedKey, flattenFeed, useFeed, useSwipe } from '../../src/api/feedHooks';
import { useProfile } from '../../src/api/hooks';
import type { FeedJob } from '../../src/api/jobs';
import { Button } from '../../src/components/Button';
import { Plane, Sliders, X } from '../../src/components/icons';
import { FeedFilterSheet } from '../../src/components/FeedFilterSheet';
import { activeFilterCount, applyFeedFilter, isFilterActive } from '../../src/lib/feedFilter';
import { swipeDirection, swipeFailure } from '../../src/lib/swipe';
import { useFeedFilter } from '../../src/store/feedFilter';
import { SwipeDeck, type SwipeDeckHandle, type SwipeDir } from '../../src/components/SwipeDeck';
import { Wordmark } from '../../src/components/Wordmark';
import { colors, fonts, ink, layout, shadow } from '../../src/theme';

const PREFETCH_WHEN_LEFT = 5;
const CARD_MARGIN = 10; // card quase de borda a borda, como no Tinder

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const deck = useRef<SwipeDeckHandle>(null);
  const { data: profile } = useProfile();
  const feed = useFeed();
  const { mutateAsync: swipeAsync } = useSwipe();

  // ids já swipados nesta sessão: somem do deck na hora, antes de o servidor confirmar
  const [swiped, setSwiped] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const filter = useFeedFilter((s) => s.filter);
  const setFilter = useFeedFilter((s) => s.set);
  const resetFilter = useFeedFilter((s) => s.reset);
  const [notice, setNotice] = useState<string | null>(null);

  const viewer = useMemo(
    () => ({
      skills: profile?.skills ?? [],
      coords: profile?.lat != null && profile?.lng != null ? { lat: profile.lat, lng: profile.lng } : null,
    }),
    [profile],
  );
  const jobs = useMemo(
    () => applyFeedFilter(flattenFeed(feed.data).filter((j) => !swiped.has(j.id)), filter, viewer.coords),
    [feed.data, swiped, filter, viewer.coords],
  );
  const filtering = isFilterActive(filter);

  // pré-carrega a próxima página antes do deck esvaziar
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    if (jobs.length <= PREFETCH_WHEN_LEFT && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [jobs.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onSwiped = useCallback(
    (job: FeedJob, dir: SwipeDir) => {
      setNotice(null);
      setSwiped((prev) => new Set(prev).add(job.id));
      // mutateAsync (e não callbacks do mutate): swipes rápidos em sequência não podem perder o resultado do anterior
      swipeAsync({ jobId: job.id, direction: swipeDirection(dir) })
        // like não mostra "match": a empresa é que entra em contato, e a conversa aparece no chat quando ela escrever
        .catch((e) => {
          // 409: já foi swipada em outro lugar — some do deck. Outras falhas: a vaga volta pro deck.
          const { restore, notice } = swipeFailure(e);
          if (restore) {
            setSwiped((prev) => {
              const next = new Set(prev);
              next.delete(job.id);
              return next;
            });
          }
          if (notice) setNotice(notice);
        });
    },
    [swipeAsync],
  );

  const openJob = useCallback((job: FeedJob) => router.push({ pathname: '/job/[id]', params: { id: job.id } }), [router]);

  const refresh = () => {
    setSwiped(new Set());
    qc.resetQueries({ queryKey: feedKey });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: 4,
          paddingBottom: 10,
          minHeight: 48,
        }}
      >
        <Wordmark size={28} />
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityLabel="filtrar vagas"
          hitSlop={8}
          style={{
            position: 'absolute',
            right: layout.gutter,
            top: 2,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: filtering ? colors.ink : colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sliders size={20} color={filtering ? colors.white : colors.ink} />
          {filtering ? (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.monoBold, fontSize: 10, color: colors.white }}>{activeFilterCount(filter)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {notice ? (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger, paddingHorizontal: layout.gutter, paddingBottom: 8 }}>
          {notice}
        </Text>
      ) : null}

      <View style={{ flex: 1, paddingHorizontal: CARD_MARGIN }}>
        {feed.isPending ? (
          <Loading logo={false} />
        ) : feed.isError ? (
          <Centered>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
              {friendlyMessage(feed.error)}
            </Text>
            <Button label="tentar de novo" onPress={() => feed.refetch()} style={{ alignSelf: 'stretch' }} />
          </Centered>
        ) : jobs.length === 0 && (isFetchingNextPage || hasNextPage) ? (
          <Loading logo={false} />
        ) : jobs.length === 0 && filtering ? (
          <Centered>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: 'center' }}>nenhuma vaga com esses filtros</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6), textAlign: 'center' }}>
              tenta aumentar a distância ou tirar alguma tag.
            </Text>
            <Button label="limpar filtros" onPress={resetFilter} style={{ alignSelf: 'stretch' }} />
          </Centered>
        ) : jobs.length === 0 ? (
          <Centered>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.ink, textAlign: 'center' }}>Acabou por hoje! 💜</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: ink(0.6), textAlign: 'center' }}>
              você já viu todas as vagas pra você. volta daqui a pouco que sempre entra coisa nova.
            </Text>
            <Button label="Atualizar" onPress={refresh} style={{ alignSelf: 'stretch' }} />
          </Centered>
        ) : (
          <SwipeDeck ref={deck} jobs={jobs} viewer={viewer} onSwiped={onSwiped} onOpen={openJob} />
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, paddingVertical: 14 }}>
        <RoundButton size={68} bg={colors.white} onPress={() => deck.current?.swipe('left')} disabled={!jobs.length} label="passar">
          <X size={30} color={colors.danger} sw={3} />
        </RoundButton>
        <RoundButton size={68} bg={colors.white} onPress={() => deck.current?.swipe('right')} disabled={!jobs.length} label="candidatar">
          <Plane size={30} color={colors.success} />
        </RoundButton>
      </View>

      <FeedFilterSheet
        visible={filterOpen}
        filter={filter}
        skills={profile?.skills ?? []}
        hasLocation={viewer.coords !== null}
        onApply={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 }}>{children}</View>;
}

function RoundButton({
  size,
  bg,
  glow,
  onPress,
  disabled,
  label,
  children,
}: {
  size: number;
  bg: string;
  glow?: string;
  onPress: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        glow ? { shadowColor: glow, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 } : shadow.soft,
      ]}
    >
      {children}
    </Pressable>
  );
}
