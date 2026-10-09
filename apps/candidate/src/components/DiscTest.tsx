import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';
import { friendlyMessage } from '../api/errors';
import { useSubmitDisc } from '../api/hooks';
import { DISC_LABELS, DISC_QUESTIONS, type DiscDimension } from '../data/disc';
import { advanceDisc } from '../lib/disc';
import { colors, fonts, ink, layout, radius } from '../theme';

export function DiscTest({
  profileId,
  onDone,
  doneLabel = 'bora swipar',
}: {
  profileId: string;
  onDone: () => void;
  doneLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiscDimension[]>([]);
  const [error, setError] = useState<string | null>(null);
  const submit = useSubmitDisc(profileId);

  const question = DISC_QUESTIONS[step];
  const result = submit.data?.dominant;

  async function pick(dimension: DiscDimension) {
    const { done, answers: next } = advanceDisc(answers, dimension);
    setError(null);
    if (!done) {
      setAnswers(next);
      setStep(step + 1);
      return;
    }
    try {
      await submit.mutateAsync(next);
      setAnswers(next);
    } catch (e) {
      setError(friendlyMessage(e));
    }
  }

  if (result) {
    const info = DISC_LABELS[result];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: layout.gutter, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink, letterSpacing: 1 }}>SEU PERFIL DISC</Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 96, color: colors.primary, lineHeight: 104 }}>{result}</Text>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink }}>{info.name}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: ink(0.6), textAlign: 'center' }}>{info.blurb}</Text>
        </View>
        <Button label={doneLabel} onPress={onDone} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: layout.gutter, gap: 24 }}>
      <View style={{ gap: 12, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.monoMedium, fontSize: 12, color: ink(0.55) }}>
            {step + 1}/{DISC_QUESTIONS.length}
          </Text>
          <Pressable onPress={onDone} hitSlop={12}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: ink(0.5) }}>pular por agora</Text>
          </Pressable>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: ink(0.08) }}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.primary,
              width: `${((step + 1) / DISC_QUESTIONS.length) * 100}%`,
            }}
          />
        </View>
      </View>

      <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.8, color: colors.ink }}>{question.text}</Text>

      <View style={{ gap: 10 }}>
        {question.options.map((o) => (
          <Pressable
            key={o.dimension}
            disabled={submit.isPending}
            onPress={() => pick(o.dimension)}
            style={({ pressed }) => ({
              backgroundColor: colors.white,
              borderRadius: radius.panel - 4,
              borderWidth: 1.5,
              borderColor: pressed ? colors.primary : ink(0.1),
              padding: 16,
            })}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{o.text}</Text>
          </Pressable>
        ))}
      </View>

      {submit.isPending ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>{error}</Text> : null}
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.45) }}>
        o teste é opcional e só ajuda a achar vagas com mais a ver com você — nunca te penaliza.
      </Text>
    </SafeAreaView>
  );
}

