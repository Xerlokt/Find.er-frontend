import { Loading } from '../src/components/Loading';
import { useRouter } from 'expo-router';
import { useProfile } from '../src/api/hooks';
import { DiscTest } from '../src/components/DiscTest';
import { colors } from '../src/theme';

export default function RedoDiscScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  if (!profile) return <Loading />;
  return <DiscTest profileId={profile.id} onDone={back} doneLabel="voltar pro perfil" />;
}
