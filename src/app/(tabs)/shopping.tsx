import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function ShoppingRoute() {
  return (
    <Screen title="Shopping">
      <EmptyState
        doodle="groceryBag"
        headline="Nothing to buy yet"
        sentence="Things you need from the store will be listed here."
      />
    </Screen>
  );
}
