import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';

export default function TonightRoute() {
  const router = useRouter();

  return (
    <Screen
      title="Tonight"
      trailing={
        <IconButton symbol="gearshape" label="Settings" onPress={() => router.push('/settings')} />
      }>
      <EmptyState
        doodle="egg"
        headline="Nothing cooking yet"
        sentence="Dinner ideas will show up here once your kitchen has food in it."
      />
    </Screen>
  );
}
