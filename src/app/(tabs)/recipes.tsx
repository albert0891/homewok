import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function RecipesRoute() {
  return (
    <Screen title="Recipes">
      <EmptyState
        doodle="riceBowl"
        headline="No recipes yet"
        sentence="Recipes you save or cook will be kept here."
      />
    </Screen>
  );
}
