/**
 * Turns the household's rows into what the Kitchen screen lists: one section per
 * storage place and one for staples, with one row per food.
 */
import type { Batch, HouseholdData, Ingredient, StapleStatus } from '@/data/rows';
import { type StorageId, STORAGES } from '@/data/storages';

import { formatTotal } from './amounts';
import { dateNote, type Day, soonestFirst } from './dates';

/** One row of the list, as text ready to show. */
export type KitchenRow = {
  key: string;
  ingredientId: string;
  name: string;
  /** The quiet line under the name: the date, or how many purchases. */
  meta: string | null;
  /** The use-soon pill: "Today", "Tomorrow", "2 days". */
  pill: string | null;
  /** "Past date, check first". */
  warning: string | null;
  /** On the right: "1½ lb", "~2 blocks", or a staple's "Have". */
  amount: string;
};

/** A section in the shape React Native's SectionList takes. */
export type KitchenSection = {
  id: StorageId | 'staples';
  title: string;
  data: KitchenRow[];
};

/** What a staple's row shows in place of an amount. */
export const STATUS_LABELS: Record<StapleStatus, string> = {
  have: 'Have',
  low: 'Low',
  out: 'Out',
};

/** "2 purchases" and "Use by Fri, Nov 20" become "2 purchases, use by Fri, Nov 20". */
function joinMeta(parts: (string | null)[]): string | null {
  const [first, ...rest] = parts.filter((part) => part !== null);
  if (first === undefined) {
    return null;
  }
  return [first, ...rest.map((part) => part.charAt(0).toLowerCase() + part.slice(1))].join(', ');
}

/** One food in one storage place: the total of its purchases there, and the soonest date. */
function foodRow(ingredient: Ingredient, batches: Batch[], storage: StorageId, today: Day): KitchenRow {
  const soonest = batches[0];
  const note = dateNote(soonest.use_by, soonest.date_source, today);

  return {
    key: `${ingredient.id}:${storage}`,
    ingredientId: ingredient.id,
    name: ingredient.name,
    meta: joinMeta([
      batches.length > 1 ? `${batches.length} purchases` : null,
      note.type === 'later' ? note.text : null,
    ]),
    pill: note.type === 'soon' ? note.text : null,
    warning: note.type === 'past' ? note.text : null,
    amount: formatTotal(batches),
  };
}

/** The foods kept in one storage place. The one that needs using first is at the top. */
function foodRows(data: HouseholdData, storage: StorageId, today: Day): KitchenRow[] {
  return data.ingredients
    .map((ingredient) => ({
      ingredient,
      batches: soonestFirst(
        data.batches.filter(
          (batch) => batch.ingredient_id === ingredient.id && batch.storage === storage,
        ),
      ),
    }))
    .filter((food) => food.batches.length > 0)
    .sort(
      (a, b) =>
        a.batches[0].use_by.localeCompare(b.batches[0].use_by) ||
        a.ingredient.name.localeCompare(b.ingredient.name),
    )
    .map((food) => foodRow(food.ingredient, food.batches, storage, today));
}

/** Staples by name. They show have, low, or out, and never a date. */
function stapleRows(data: HouseholdData): KitchenRow[] {
  return data.ingredients
    .filter((ingredient) => ingredient.tracking === 'level')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ingredient) => ({
      key: ingredient.id,
      ingredientId: ingredient.id,
      name: ingredient.name,
      meta: null,
      pill: null,
      warning: null,
      amount: STATUS_LABELS[ingredient.status ?? 'have'],
    }));
}

/**
 * The Kitchen list: Fridge, Freezer, Pantry, then Staples. A section with nothing in
 * it is left out, so an empty kitchen gives an empty list.
 */
export function kitchenSections(data: HouseholdData, today: Day): KitchenSection[] {
  const places: KitchenSection[] = STORAGES.map((storage) => ({
    id: storage.id,
    title: storage.label,
    data: foodRows(data, storage.id, today),
  }));
  const staples: KitchenSection = { id: 'staples', title: 'Staples', data: stapleRows(data) };

  return [...places, staples].filter((section) => section.data.length > 0);
}

/**
 * What VoiceOver reads for a row, in the order the row shows it. A pill alone, such
 * as "2 days", would not say what it means, so it gets "use soon" in front.
 */
export function rowLabel(row: KitchenRow): string {
  return [row.name, row.meta, row.pill && `use soon: ${row.pill}`, row.warning, row.amount]
    .filter((part) => part !== null)
    .join(', ');
}
