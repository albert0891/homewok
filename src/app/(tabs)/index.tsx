import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function TonightRoute() {
  return (
    <Screen title="Tonight">
      <EmptyState
        doodle="egg"
        headline="Nothing cooking yet"
        sentence="Dinner ideas will show up here once your kitchen has food in it."
      />
    </Screen>
  );
}
