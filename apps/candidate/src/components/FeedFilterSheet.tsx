import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Chip } from './Chip';
import { Slider } from './Slider';
import { skillName } from '../data/taxonomy';
import { DEFAULT_FEED_FILTER, toggleSkill, type FeedFilter } from '../lib/feedFilter';
import { RADIUS_MAX_KM, RADIUS_MIN_KM, RADIUS_STEP_KM } from '../lib/radius';
import { colors, fonts, ink, layout, radius } from '../theme';

type Props = {
  visible: boolean;
  filter: FeedFilter;
  /** tags oferecidas = as skills que o candidato colocou no perfil */
  skills: string[];
  hasLocation: boolean;
  onApply: (f: FeedFilter) => void;
  onClose: () => void;
};

export function FeedFilterSheet({ visible, filter, skills, hasLocation, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(filter);
  // reabrir mostra sempre o filtro aplicado, descartando edições não aplicadas
  useEffect(() => {
    if (visible) setDraft(filter);
  }, [visible, filter]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(14,9,19,0.45)' }} />
      <SafeAreaView
        edges={['bottom']}
        style={{ backgroundColor: colors.bg, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}
      >
        <ScrollView
          style={{ maxHeight: 560 }}
          contentContainerStyle={{ padding: layout.gutter, paddingTop: 22, gap: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.8, color: colors.ink }}>
            filtrar vagas<Text style={{ color: colors.accent }}>.</Text>
          </Text>

          <View style={{ gap: 8 }}>
            <Slider
              label="distância máxima"
              unit=" km"
              min={RADIUS_MIN_KM}
              max={RADIUS_MAX_KM}
              step={RADIUS_STEP_KM}
              openEnded
              value={draft.radiusKm}
              onChange={(radiusKm) => setDraft((d) => ({ ...d, radiusKm }))}
            />
            {!hasLocation ? (
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.55) }}>
                compartilhe sua localização em "editar perfil" para o filtro de distância funcionar.
              </Text>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.55), textTransform: 'uppercase', letterSpacing: 0.6 }}>
              tags (suas skills)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((s) => (
                <Chip key={s} label={skillName(s)} selected={draft.skills.includes(s)} onPress={() => setDraft((d) => toggleSkill(d, s))} />
              ))}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.55) }}>
              mostra vagas que pedem ao menos uma das tags marcadas. sem tags, mostra todas.
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Button
              label="aplicar"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
            <Button label="limpar filtros" variant="ghost" onPress={() => setDraft({ ...DEFAULT_FEED_FILTER, skills: [] })} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
