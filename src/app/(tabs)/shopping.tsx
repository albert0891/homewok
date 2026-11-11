import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function ShoppingRoute() {
  return (
    <Screen title="Shopping">
      {/* The shopping doodle is drawn in milestone 2, when this screen is built. */}
      <EmptyState
        headline="Nothing to buy yet"
        sentence="Things you need from the store will be listed here."
      />
    </Screen>
  );
}
