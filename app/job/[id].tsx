import { Pressable, ScrollView, Text, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { friendlyMessage } from '../../src/api/errors';
import { useCompany, useJob } from '../../src/api/feedHooks';
import { useProfile } from '../../src/api/hooks';
import { Button } from '../../src/components/Button';
import { CompanyLogo, JobFacts, SkillChip } from '../../src/components/JobCard';
import { DISC_LABELS } from '../../src/data/disc';
import { professionName } from '../../src/data/taxonomy';
import { brandColor } from '../../src/lib/format';
import { colors, fonts, ink, layout, radius } from '../../src/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { job, query } = useJob(id);
  const { data: company } = useCompany(job?.companyId);

  const viewer = {
    skills: profile?.skills ?? [],
    coords: profile?.lat != null && profile?.lng != null ? { lat: profile.lat, lng: profile.lng } : null,
  };
  const have = new Set(viewer.skills);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: layout.gutter, justifyContent: 'center', gap: 16 }}>
        {query.isError ? (
          <>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'center' }}>
              {friendlyMessage(query.error)}
            </Text>
            <Button label="voltar" onPress={back} />
          </>
        ) : (
          <Loading logo={false} inline />
        )}
      </SafeAreaView>
    );
  }

  const feedJob = { ...job, fitScore: job.fitScore ?? 0 };
  const matched = job.requiredSkills.filter((s) => have.has(s)).length;
  const expires = new Date(job.expiresAt).toLocaleDateString('pt-BR');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: layout.gutter, paddingVertical: 10 }}>
        <Pressable onPress={back} hitSlop={12}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary }}>‹ voltar</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: layout.gutter, paddingTop: 4, gap: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CompanyLogo companyId={job.companyId} name={company?.name} logoUrl={company?.logoUrl} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink }}>{company?.name ?? '···'}</Text>
            {company && company.rating > 0 ? (
              <Text style={{ fontFamily: fonts.monoMedium, fontSize: 12, color: ink(0.55) }}>★ {company.rating.toFixed(1)}</Text>
            ) : null}
          </View>
          {job.fitScore != null ? (
            <View
              style={{
                backgroundColor: colors.lime,
                borderWidth: 2,
                borderColor: colors.ink,
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignItems: 'center',
                transform: [{ rotate: '-4deg' }],
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>{Math.round(job.fitScore)}%</Text>
              <Text style={{ fontFamily: fonts.monoBold, fontSize: 9, color: colors.ink }}>match</Text>
            </View>
          ) : null}
        </View>

        <Text style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.9, color: colors.ink }}>{job.title}</Text>
        <JobFacts job={feedJob} viewer={viewer} />

        <Section title={`skills • você tem ${matched} de ${job.requiredSkills.length}`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {job.requiredSkills.map((s) => (
              <SkillChip key={s} id={s} have={have.has(s)} />
            ))}
          </View>
        </Section>

        <Section title="sobre a vaga">
          <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: ink(0.8) }}>{job.description}</Text>
        </Section>

        {company?.description ? (
          <Section title={`sobre a ${company.name}`}>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: ink(0.8) }}>{company.description}</Text>
          </Section>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Meta>{professionName(job.professionId)}</Meta>
          {job.discProfile ? <Meta>{`perfil ${job.discProfile} • ${DISC_LABELS[job.discProfile].name}`}</Meta> : null}
          <Meta>{`vaga até ${expires}`}</Meta>
        </View>
      </ScrollView>
      <View style={{ height: 3, backgroundColor: brandColor(job.companyId) }} />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.55), textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Meta({ children }: { children: string }) {
  return (
    <View style={{ borderRadius: radius.pill, borderWidth: 1.5, borderColor: ink(0.12), paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: ink(0.65) }}>{children}</Text>
    </View>
  );
}
