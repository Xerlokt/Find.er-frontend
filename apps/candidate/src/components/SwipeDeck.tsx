import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { FeedJob } from '../api/jobs';
import { JobCard, type Viewer } from './JobCard';
import { consumeDeckIntro, peekPose } from '../lib/deckPeek';
import { colors, fonts } from '../theme';

export type SwipeDir = 'left' | 'right';
export type SwipeDeckHandle = { swipe: (dir: SwipeDir) => void };

const SCREEN_W = Dimensions.get('window').width;
const THRESHOLD = 110; // mesmo limiar do design
const VISIBLE = 3;

type CardApi = { swipe: (dir: SwipeDir) => void };

/** Carimbo ROLA/PASSA: a opacidade acompanha o arrasto horizontal do card. */
function Stamp({ label, color, side, x }: { label: string; color: string; side: 'left' | 'right'; x: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: side === 'left' ? interpolate(x.value, [0, 100], [0, 1], 'clamp') : interpolate(x.value, [-100, 0], [1, 0], 'clamp'),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 72,
          [side]: 22,
          borderWidth: 5,
          borderColor: color,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 2,
          backgroundColor: 'rgba(14,9,19,0.18)',
          transform: [{ rotate: side === 'left' ? '-12deg' : '12deg' }],
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 42, color, letterSpacing: 2 }}>{label}</Text>
    </Animated.View>
  );
}

type DeckCardProps = {
  job: FeedJob;
  depth: number;
  viewer: Viewer;
  onSwiped: (job: FeedJob, dir: SwipeDir) => void;
  onOpen: (job: FeedJob) => void;
  register: (id: string, api: CardApi | null) => void;
  peek: SharedValue<number>; // 0 = pilha normal, 1 = leque aberto (animação de abertura do app)
};

function DeckCard({ job, depth, viewer, onSwiped, onOpen, register, peek }: DeckCardProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const baseY = useSharedValue(depth * 10);
  const scale = useSharedValue(1 - depth * 0.04);
  const gone = useSharedValue(false);

  // ao subir de posição no deck o card "encaixa" com mola
  useEffect(() => {
    baseY.value = withSpring(depth * 10);
    scale.value = withSpring(1 - depth * 0.04);
  }, [depth, baseY, scale]);

  const finished = useCallback((dir: SwipeDir) => onSwiped(job, dir), [job, onSwiped]);
  const open = useCallback(() => onOpen(job), [job, onOpen]);

  const flingTo = (dir: SwipeDir) => {
    'worklet';
    if (gone.value) return;
    gone.value = true;
    x.value = withTiming((dir === 'right' ? 1 : -1) * SCREEN_W * 1.4, { duration: 350 }, (done) => {
      if (done) scheduleOnRN(finished, dir);
    });
  };

  // os botões (X / avião) disparam o mesmo voo do gesto
  const flingRef = useRef(flingTo);
  flingRef.current = flingTo;
  useEffect(() => {
    register(job.id, { swipe: (d) => flingRef.current(d) });
    return () => register(job.id, null);
  }, [job.id, register]);

  const pan = Gesture.Pan()
    .enabled(depth === 0)
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      const fast = Math.abs(e.velocityX) > 900 && Math.abs(x.value) > 40;
      if (Math.abs(x.value) > THRESHOLD || fast) {
        flingTo(x.value > 0 ? 'right' : 'left');
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const tap = Gesture.Tap()
    .enabled(depth === 0)
    .maxDistance(8)
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(open);
    });

  const animated = useAnimatedStyle(() => {
    const pose = peekPose(depth, peek.value);
    return {
      transform: [
        { translateX: x.value + pose.x },
        { translateY: baseY.value + y.value + pose.y },
        { rotate: `${x.value * 0.05 + pose.rotate}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View
        pointerEvents={depth === 0 ? 'auto' : 'none'}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 - depth }, animated]}
      >
        <JobCard job={job} viewer={viewer} />
        {depth === 0 ? (
          <>
            <Stamp label="ROLA" color={colors.lime} side="left" x={x} />
            <Stamp label="PASSA" color={colors.danger} side="right" x={x} />
          </>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

type Props = {
  jobs: FeedJob[];
  viewer: Viewer;
  onSwiped: (job: FeedJob, dir: SwipeDir) => void;
  onOpen: (job: FeedJob) => void;
};

export const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(function SwipeDeck({ jobs, viewer, onSwiped, onOpen }, ref) {
  const cards = useRef(new Map<string, CardApi>());
  const register = useCallback((id: string, api: CardApi | null) => {
    if (api) cards.current.set(id, api);
    else cards.current.delete(id);
  }, []);

  useImperativeHandle(ref, () => ({
    swipe: (dir) => {
      const top = jobs[0];
      if (top) cards.current.get(top.id)?.swipe(dir);
    },
  }));

  // ao abrir o app o baralho se abre em leque por um instante ("espiando") e volta para a pilha; só uma vez por abertura
  const peek = useSharedValue(0);
  useEffect(() => {
    if (!consumeDeckIntro(jobs.length)) return;
    peek.value = withSequence(
      withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
      withDelay(700, withTiming(0, { duration: 560, easing: Easing.inOut(Easing.cubic) })),
    );
  }, [jobs.length, peek]);

  return (
    <View style={{ flex: 1 }}>
      {jobs.slice(0, VISIBLE).map((job, depth) => (
        <DeckCard key={job.id} job={job} depth={depth} viewer={viewer} onSwiped={onSwiped} onOpen={onOpen} register={register} peek={peek} />
      ))}
    </View>
  );
});
