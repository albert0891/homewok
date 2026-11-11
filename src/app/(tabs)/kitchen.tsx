import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function KitchenRoute() {
  return (
    <Screen title="Kitchen">
      <EmptyState
        doodle="scallion"
        headline="Your kitchen is empty"
        sentence="The food you have at home will be listed here."
      />
    </Screen>
  );
}
