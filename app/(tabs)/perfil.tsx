import { Pressable, ScrollView, Text, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { friendlyMessage } from '../../src/api/errors';
import { useDisc, useProfile } from '../../src/api/hooks';
import { logout } from '../../src/api/auth';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { profileView } from '../../src/lib/profileView';
import { brandColor } from '../../src/lib/format';
import { colors, fonts, ink, layout, radius } from '../../src/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.55), textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.panel - 4, padding: 14, gap: 4 }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: ink(0.5), textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const profile = useProfile();
  const disc = useDisc(profile.data?.id);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: 12, paddingBottom: 8 }}>
        <ScreenTitle>Perfil</ScreenTitle>
      </View>

      {profile.isPending ? (
        <Loading logo={false} />
      ) : profile.isError || !profile.data ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: 16, padding: 32 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
            {profile.isError ? friendlyMessage(profile.error) : 'não encontramos seu perfil'}
          </Text>
          <Button label="tentar de novo" onPress={() => profile.refetch()} />
        </View>
      ) : (
        <ProfileBody
          profile={profile.data}
          disc={disc.data ?? null}
          onEdit={() => router.push('/editar-perfil')}
          onDisc={() => router.push('/refazer-disc')}
        />
      )}
    </SafeAreaView>
  );
}

function ProfileBody({
  profile,
  disc,
  onEdit,
  onDisc,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>['data']>;
  disc: Parameters<typeof profileView>[1];
  onEdit: () => void;
  onDisc: () => void;
}) {
  const v = profileView(profile, disc);
  return (
    <ScrollView contentContainerStyle={{ padding: layout.gutter, paddingBottom: 32, gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: brandColor(profile.id), alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.white }}>{v.initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.5, color: colors.ink }}>{v.name}</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: ink(0.6) }}>{v.professionLabel}</Text>
        </View>
      </View>

      <Section title="sobre você">
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: v.bio ? colors.ink : ink(0.5), lineHeight: 22 }}>
          {v.bio ?? 'ainda sem bio — conta um pouco sobre você em "editar perfil".'}
        </Text>
      </Section>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Fact label="salário desejado" value={v.salary} />
        <Fact label="raio de busca" value={v.radius} />
      </View>

      <Section title="skills">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {v.skills.map((s) => (
            <Chip key={s} label={s} />
          ))}
        </View>
      </Section>

      <Section title="como você quer trabalhar">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {v.modalities.map((m) => (
            <Chip key={m} label={m} />
          ))}
        </View>
        {!v.hasLocation ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: ink(0.5) }}>
            localização não compartilhada — compartilhe em "editar perfil" para ver vagas por perto.
          </Text>
        ) : null}
      </Section>

      <Section title="perfil DISC">
        {v.disc ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.panel, padding: 14 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 44, color: colors.primary, width: 56, textAlign: 'center' }}>{v.disc.letter}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink }}>{v.disc.name}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ink(0.6) }}>{v.disc.blurb}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ink(0.6) }}>
            o teste é opcional e ajuda a achar vagas com mais a ver com você.
          </Text>
        )}
        <Button label={v.discActionLabel} variant="ghost" onPress={onDisc} />
      </Section>

      <View style={{ gap: 10 }}>
        <Button label="editar perfil" onPress={onEdit} />
        <Pressable onPress={logout} style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent }}>sair da conta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
