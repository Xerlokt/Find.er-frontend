import { Loading } from '../../src/components/Loading';
import { DiscTest } from '../../src/components/DiscTest';
import { useProfile } from '../../src/api/hooks';
import { useOnboarding } from '../../src/store/onboarding';
import { colors } from '../../src/theme';

export default function DiscScreen() {
  const { data: profile } = useProfile();
  const setPendingDisc = useOnboarding((s) => s.setPendingDisc);

  if (!profile) return <Loading />;
  return <DiscTest profileId={profile.id} onDone={() => setPendingDisc(false)} />;
}
