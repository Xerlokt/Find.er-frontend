import { useState } from 'react';
import { Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './Button';
import { Chip } from './Chip';
import { Slider } from './Slider';
import { TextField } from './TextField';
import { useSaveProfile } from '../api/hooks';
import { friendlyMessage } from '../api/errors';
import type { CandidateProfile } from '../api/candidates';
import { MODALITIES, PROFESSIONS, SKILLS } from '../data/taxonomy';
import { colors, fonts, ink } from '../theme';
import { RADIUS_DEFAULT_KM, RADIUS_MAX_KM, RADIUS_MIN_KM, RADIUS_STEP_KM } from '../lib/radius';
import { buildProfileInput, profileDefaults, profileSchema, type ProfileFormValues } from '../lib/profileForm';


type Props = {
  initial?: CandidateProfile | null;
  submitLabel: string;
  onSaved: (profile: CandidateProfile) => void;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.55), textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {children}
    </Text>
  );
}

function ErrorText({ children }: { children?: string }) {
  return children ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.danger }}>{children}</Text> : null;
}

export function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const save = useSaveProfile();
  const [serverError, setServerError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'denied'>('idle');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults(initial),
  });

  async function useMyLocation() {
    setLocStatus('loading');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return setLocStatus('denied');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocStatus('idle');
    } catch {
      setLocStatus('denied');
    }
  }

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      const profile = await save.mutateAsync(buildProfileInput(v, coords));
      onSaved(profile);
    } catch (e) {
      setServerError(friendlyMessage(e));
    }
  });

  return (
    <View style={{ gap: 24 }}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="nome"
            placeholder="Maria Clara Souza"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field }) => (
          <TextField
            label="sobre você (opcional)"
            placeholder="conta em poucas palavras o que você faz"
            multiline
            style={{ minHeight: 88, textAlignVertical: 'top' }}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.bio?.message}
          />
        )}
      />

      <View style={{ gap: 10 }}>
        <SectionLabel>sua área</SectionLabel>
        <Controller
          control={control}
          name="professionId"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PROFESSIONS.map((p) => (
                <Chip key={p.id} label={p.name} selected={field.value === p.id} onPress={() => field.onChange(p.id)} />
              ))}
            </View>
          )}
        />
        <ErrorText>{errors.professionId?.message}</ErrorText>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>skills</SectionLabel>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SKILLS.map((s) => {
                const on = field.value.includes(s.id);
                return (
                  <Chip
                    key={s.id}
                    label={s.name}
                    selected={on}
                    onPress={() => field.onChange(on ? field.value.filter((x) => x !== s.id) : [...field.value, s.id])}
                  />
                );
              })}
            </View>
          )}
        />
        <ErrorText>{errors.skills?.message}</ErrorText>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>como você quer trabalhar</SectionLabel>
        <Controller
          control={control}
          name="preferredModalities"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MODALITIES.map((m) => {
                const on = field.value.includes(m.id);
                return (
                  <Chip
                    key={m.id}
                    label={m.name}
                    selected={on}
                    onPress={() => field.onChange(on ? field.value.filter((x) => x !== m.id) : [...field.value, m.id])}
                  />
                );
              })}
            </View>
          )}
        />
        <ErrorText>{errors.preferredModalities?.message}</ErrorText>
      </View>

      <Controller
        control={control}
        name="salary"
        render={({ field }) => (
          <TextField
            label="salário desejado em R$ (opcional)"
            placeholder="14000"
            keyboardType="numeric"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.salary?.message}
          />
        )}
      />

      <View style={{ gap: 10 }}>
        <SectionLabel>localização (opcional)</SectionLabel>
        <Button
          label={coords ? 'localização salva ✓ (atualizar)' : 'usar minha localização'}
          variant="ghost"
          loading={locStatus === 'loading'}
          onPress={useMyLocation}
          style={{ borderWidth: 1.5, borderColor: ink(0.15) }}
        />
        {locStatus === 'denied' ? (
          <ErrorText>sem permissão de localização — dá pra continuar sem ela</ErrorText>
        ) : (
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.5) }}>
            ajuda a achar vagas perto de você (entra no cálculo do match)
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="radius"
        render={({ field }) => (
          <Slider
            label="raio de busca"
            unit=" km"
            min={RADIUS_MIN_KM}
            max={RADIUS_MAX_KM}
            step={RADIUS_STEP_KM}
            openEnded
            value={Number(field.value) || RADIUS_DEFAULT_KM}
            onChange={(v) => field.onChange(String(v))}
          />
        )}
      />

      {serverError ? (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>{serverError}</Text>
      ) : null}
      <Button label={submitLabel} onPress={onSubmit} loading={save.isPending} />
    </View>
  );
}
