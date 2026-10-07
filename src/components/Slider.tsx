import { useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { colors, fonts, ink } from '../theme';
import { ratioFromValue, valueFromRatio } from '../lib/slider';

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** no valor máximo mostra "max+" (sem limite superior) */
  openEnded?: boolean;
};

const THUMB = 28;
const TRACK = 6;

export function Slider({ label, value, onChange, min, max, step = 1, unit = '', openEnded = false }: Props) {
  const [width, setWidth] = useState(0);
  // o PanResponder é criado uma vez; props mutáveis ficam num ref
  const live = useRef({ width, min, max, step, onChange });
  live.current = { width, min, max, step, onChange };

  function fromX(x: number) {
    const { width: w, min: lo, max: hi, step: st, onChange: emit } = live.current;
    const usable = w - THUMB;
    if (usable <= 0) return;
    emit(valueFromRatio((x - THUMB / 2) / usable, lo, hi, st));
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => fromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => fromX(e.nativeEvent.locationX),
    }),
  ).current;

  const ratio = ratioFromValue(value, min, max);
  const usable = Math.max(0, width - THUMB);
  const thumbLeft = ratio * usable;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: ink(0.7) }}>{label}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.primary }}>
          {value}
          {openEnded && value >= max ? '+' : ''}
          {unit}
        </Text>
      </View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: THUMB + 12, justifyContent: 'center' }}
        {...pan.panHandlers}
      >
        <View pointerEvents="none" style={{ height: TRACK, borderRadius: TRACK / 2, backgroundColor: ink(0.1) }}>
          <View
            style={{ width: thumbLeft + THUMB / 2, height: TRACK, borderRadius: TRACK / 2, backgroundColor: colors.primary }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: thumbLeft,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: colors.white,
            borderWidth: 3,
            borderColor: colors.primary,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: ink(0.45) }}>
          {min}
          {unit}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: ink(0.45) }}>
          {max}
          {openEnded ? '+' : ''}
          {unit}
        </Text>
      </View>
    </View>
  );
}
