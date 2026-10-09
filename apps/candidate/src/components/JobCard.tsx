import { Image, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useCompany } from '../api/feedHooks';
import type { FeedJob } from '../api/jobs';
import { skillName } from '../data/taxonomy';
import { brandColor, distanceKm, formatDistance, formatSalary, initialOf, MODALITY_LABEL, timeAgo } from '../lib/format';
import { colors, fonts, ink, radius, shadow } from '../theme';
import { Clock, Money, Pin, Sparkle, Wifi } from './icons';

export type Viewer = { skills: string[]; coords: { lat: number; lng: number } | null };

/** Logo da empresa: imagem quando existe, senão a inicial sobre a cor da marca. */
export function CompanyLogo({ companyId, name, logoUrl, size = 24 }: { companyId: string; name?: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ink(0.1) }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: brandColor(companyId), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, color: colors.white }}>{initialOf(name)}</Text>
    </View>
  );
}

/** `dark` = sobre fundo escuro (card do feed); `light` = sobre papel (detalhe da vaga). */
export type Tone = 'light' | 'dark';

export function SkillChip({ id, have, tone = 'light' }: { id: string; have: boolean; tone?: Tone }) {
  const dark = tone === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1.5,
        borderColor: dark ? (have ? colors.lime : 'rgba(255,255,255,0.4)') : have ? 'rgba(26,143,92,0.35)' : 'rgba(108,77,246,0.35)',
        backgroundColor: dark ? (have ? 'rgba(216,255,74,0.16)' : 'rgba(255,255,255,0.08)') : have ? 'rgba(26,143,92,0.1)' : 'transparent',
      }}
    >
      {have ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: dark ? colors.lime : colors.successText }}>✓</Text> : null}
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: dark ? colors.white : have ? colors.successText : colors.primary }}>
        {skillName(id)}
      </Text>
    </View>
  );
}

export function InfoChip({ children, bg, icon, tone = 'light' }: { children: string; bg?: string; icon?: React.ReactNode; tone?: Tone }) {
  const dark = tone === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: bg ?? (dark ? 'rgba(255,255,255,0.18)' : ink(0.06)),
      }}
    >
      {icon}
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11.5, color: bg || !dark ? colors.ink : colors.white }}>{children}</Text>
    </View>
  );
}

/** Chips de salário / distância / modalidade, compartilhados entre o card e o detalhe. */
export function JobFacts({ job, viewer, tone = 'light' }: { job: FeedJob; viewer: Viewer; tone?: Tone }) {
  const soft = tone === 'dark' ? 'rgba(255,255,255,0.8)' : ink(0.65);
  const dist =
    viewer.coords && job.lat != null && job.lng != null
      ? formatDistance(distanceKm(viewer.coords, { lat: job.lat, lng: job.lng }))
      : null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      <InfoChip bg={colors.lime} icon={<Money size={13} color={colors.ink} sw={2.2} />}>
        {formatSalary(job.salaryMin, job.salaryMax)}
      </InfoChip>
      {dist ? <InfoChip tone={tone} icon={<Pin size={13} color={soft} />}>{dist}</InfoChip> : null}
      <InfoChip tone={tone} icon={<Wifi size={13} color={soft} />}>{MODALITY_LABEL[job.modality]}</InfoChip>
    </View>
  );
}

export function JobCard({ job, viewer }: { job: FeedJob; viewer: Viewer }) {
  const { data: company } = useCompany(job.companyId);
  const brand = brandColor(job.companyId);
  const have = new Set(viewer.skills);

  return (
    <View style={[{ flex: 1, borderRadius: radius.card, backgroundColor: brand }, shadow.card]}>
      <View style={{ flex: 1, borderRadius: radius.card, overflow: 'hidden' }}>
        {/* "foto": o backend não tem imagem de vaga, então cor da marca + formas + logo grande fazem o papel */}
        <View style={{ position: 'absolute', right: -80, top: -60, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.14)' }} />
        <View style={{ position: 'absolute', left: -90, top: '38%', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.lime, opacity: 0.3 }} />
        <View style={{ position: 'absolute', top: '16%', left: 0, right: 0, alignItems: 'center' }}>
          <CompanyLogo companyId={job.companyId} name={company?.name} logoUrl={company?.logoUrl} size={132} />
        </View>

        {/* degradê escuro para o texto ficar legível, como a legenda das fotos do Tinder */}
        <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' }} width="100%" height="100%">
          <Defs>
            <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0E0913" stopOpacity="0" />
              <Stop offset="0.55" stopColor="#0E0913" stopOpacity="0.78" />
              <Stop offset="1" stopColor="#0E0913" stopOpacity="0.95" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
        </Svg>

        <View style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: colors.lime,
              borderRadius: radius.pill,
              paddingHorizontal: 11,
              paddingVertical: 6,
            }}
          >
            <Sparkle size={11} color={colors.ink} />
            <Text style={{ fontFamily: fonts.monoBold, fontSize: 13, color: colors.ink }}>{Math.round(job.fitScore)}% match</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(14,9,19,0.45)',
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Clock size={11} color="rgba(255,255,255,0.95)" sw={2.4} />
            <Text style={{ fontFamily: fonts.monoMedium, fontSize: 11, color: colors.white }}>{timeAgo(job.createdAt)}</Text>
          </View>
        </View>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CompanyLogo companyId={job.companyId} name={company?.name} logoUrl={company?.logoUrl} size={22} />
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.85)', flexShrink: 1 }}>
              {company?.name ?? '···'}
            </Text>
          </View>
          <Text numberOfLines={2} style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.9, color: colors.white }}>
            {job.title}
          </Text>
          <JobFacts job={job} viewer={viewer} tone="dark" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {job.requiredSkills.slice(0, 5).map((sk) => (
              <SkillChip key={sk} id={sk} have={have.has(sk)} tone="dark" />
            ))}
          </View>
          <Text numberOfLines={2} style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.72)' }}>
            {job.description}
          </Text>
        </View>
      </View>
    </View>
  );
}
