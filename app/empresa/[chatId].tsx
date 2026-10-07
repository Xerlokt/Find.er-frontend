import { Pressable, ScrollView, Text, View } from 'react-native';
import { Loading } from '../../src/components/Loading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChats } from '../../src/api/chatHooks';
import { useCompany, useJob } from '../../src/api/feedHooks';
import { Button } from '../../src/components/Button';
import { CompanyLogo, InfoChip } from '../../src/components/JobCard';
import { companyView } from '../../src/lib/companyView';
import { colors, fonts, ink, layout, radius } from '../../src/theme';

const label = { fontFamily: fonts.monoBold, fontSize: 11, color: ink(0.45), letterSpacing: 0.6 } as const;

export default function CompanyScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const chats = useChats();
  const chat = chats.data?.find((c) => c.id === chatId);
  const { job } = useJob(chat?.jobId ?? '');
  const { data: company } = useCompany(job?.companyId);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/chat'));

  const view = companyView(company, job, chat?.companyName);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: layout.gutter, paddingVertical: 10 }}>
        <Pressable onPress={back} hitSlop={12}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary }}>‹ voltar</Text>
        </Pressable>
      </View>

      {!chat ? (
        <Loading logo={false} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: layout.gutter, paddingTop: 4, gap: 20, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <CompanyLogo companyId={job?.companyId ?? chat.id} name={view.name} logoUrl={company?.logoUrl} size={84} />
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, textAlign: 'center' }}>{view.name}</Text>
            <View
              accessibilityLabel={view.hasRating ? `nota ${view.rating}` : 'sem avaliações'}
              style={{ backgroundColor: view.hasRating ? colors.lime : ink(0.06), borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}
            >
              <Text style={{ fontFamily: view.hasRating ? fonts.monoBold : fonts.monoMedium, fontSize: view.hasRating ? 15 : 12, color: view.hasRating ? colors.ink : ink(0.55) }}>
                {view.rating}
              </Text>
            </View>
          </View>

          {view.description ? (
            <View style={{ gap: 6 }}>
              <Text style={label}>SOBRE A EMPRESA</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: ink(0.8) }}>{view.description}</Text>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={label}>VAGA QUE ABRIU ESTA CONVERSA</Text>
            {view.job ? (
              <View style={{ backgroundColor: colors.white, borderRadius: radius.panel, padding: 16, gap: 12 }}>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink }}>{view.job.title}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <InfoChip>{view.job.modality}</InfoChip>
                  <InfoChip>{view.job.salary}</InfoChip>
                </View>
                {view.job.description ? (
                  <Text numberOfLines={6} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: ink(0.75) }}>
                    {view.job.description}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {view.job.skills.map((s) => (
                    <InfoChip key={s} bg="rgba(108,77,246,0.1)">
                      {s}
                    </InfoChip>
                  ))}
                </View>
                <Button label="ver vaga completa" onPress={() => router.push({ pathname: '/job/[id]', params: { id: view.job!.id } })} />
              </View>
            ) : (
              <Loading logo={false} inline />
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
