/**
 * The shopping list's rules: adding a thing to buy, and moving a bought item into
 * the kitchen. Like the kitchen's rules, each function returns Changes and saves
 * nothing itself.
 */
import type { Changes } from '@/data/changes';
import type { Batch, HouseholdData, Ingredient, ShoppingItem } from '@/data/rows';
import { DEFAULT_STORAGE } from '@/data/storages';
import { toBase, type UnitId, unitOf } from '@/data/units';
import { formatAmount } from '@/features/kitchen/amounts';
import { type Day, estimateUseBy } from '@/features/kitchen/dates';
import {
  cleanLabel,
  cleanName,
  findIngredient,
  newIngredient,
  sameName,
} from '@/features/kitchen/stock';

/** What "Add to list" collects. Only the name is needed. */
export type NewItem = {
  name: string;
  /** The number as typed, in `unit`. */
  quantity?: number | null;
  unit?: UnitId | null;
  label?: string | null;
};

type Added = {
  changes: Changes;
  /** True when the thing was on the list already, so nothing was added. */
  already: boolean;
};

/** Adds a thing to buy. The same food is never listed twice. */
export function addItem(data: HouseholdData, entry: NewItem, newId: string, now: string): Added {
  const name = cleanName(entry.name);
  if (name === '') {
    return { changes: {}, already: false };
  }

  const known = findIngredient(data, name);
  const onList = data.items.some(
    (row) => sameName(row.name, name) || (known !== undefined && row.ingredient_id === known.id),
  );
  if (onList) {
    return { changes: {}, already: true };
  }

  const amount =
    entry.quantity && entry.unit
      ? {
          amount: toBase(entry.quantity, entry.unit),
          unit: entry.unit,
          label: cleanLabel(entry.unit, entry.label),
        }
      : { amount: null, unit: null, label: null };

  const item: ShoppingItem = {
    id: newId,
    ingredient_id: known?.id ?? null,
    // A food the household knows keeps the name it already has.
    name: known?.name ?? name,
    ...amount,
    created_at: now,
  };
  return { changes: { items: [item] }, already: false };
}

/** Puts a food from the kitchen on the list: one that is used up, or a staple that is out. */
export function addFoodToList(
  data: HouseholdData,
  ingredientId: string,
  newId: string,
  now: string,
): Added {
  const ingredient = data.ingredients.find((row) => row.id === ingredientId);
  if (!ingredient) {
    return { changes: {}, already: false };
  }
  return addItem(data, { name: ingredient.name }, newId, now);
}

/** Takes an item off the list without buying it. */
export function removeItem(itemId: string): Changes {
  return { removeItems: [itemId] };
}

type Bought = Pick<Batch, 'amount' | 'unit' | 'label' | 'is_estimate'>;

/**
 * How much was bought. The item's own amount comes first. Without one it is the
 * usual purchase of that food, and for a food nobody knows yet it is one piece.
 * The last two are guesses, and shown as such.
 */
function boughtAmount(item: ShoppingItem, known: Ingredient | undefined): Bought {
  if (item.amount !== null && item.unit !== null) {
    return { amount: item.amount, unit: item.unit, label: item.label, is_estimate: false };
  }
  if (known?.usual_amount && known.usual_unit) {
    return {
      amount: known.usual_amount,
      unit: known.usual_unit,
      label: known.usual_label,
      is_estimate: true,
    };
  }
  return { amount: 1, unit: 'count', label: null, is_estimate: true };
}

/**
 * Checks an item off: it leaves the list and arrives in the kitchen as a new
 * purchase with an estimated date. A staple only goes back to "have".
 *
 * Returns the item's name for the toast, or null when the item is already gone.
 */
export function buyItem(
  data: HouseholdData,
  itemId: string,
  newIds: { ingredient: string; batch: string },
  today: Day,
): { name: string; changes: Changes } | null {
  const item = data.items.find((row) => row.id === itemId);
  if (!item) {
    return null;
  }

  const known =
    data.ingredients.find((row) => row.id === item.ingredient_id) ?? findIngredient(data, item.name);

  if (known?.tracking === 'level') {
    return {
      name: item.name,
      changes: { ingredients: [{ ...known, status: 'have' }], batches: [], removeItems: [item.id] },
    };
  }

  const bought = boughtAmount(item, known);
  const food = known ?? newIngredient(newIds.ingredient, item.name, unitOf(bought.unit).kind);
  // Only an amount the person gave is remembered as the usual purchase. A guess is not.
  const ingredient: Ingredient = bought.is_estimate
    ? food
    : {
        ...food,
        tracking: unitOf(bought.unit).kind,
        usual_amount: bought.amount,
        usual_unit: bought.unit,
        usual_label: bought.label,
      };

  const storage = ingredient.usual_storage ?? DEFAULT_STORAGE;
  const batch: Batch = {
    id: newIds.batch,
    ingredient_id: ingredient.id,
    ...bought,
    storage,
    spot: null,
    use_by: estimateUseBy(storage, today),
    date_source: 'estimated',
    price_cents: null,
  };

  return {
    name: item.name,
    changes: { ingredients: [ingredient], batches: [batch], removeItems: [item.id] },
  };
}

/** One row of the shopping list, as text ready to show. */
export type ShoppingRow = {
  id: string;
  name: string;
  /** "1 lb" or "2 blocks", when the person gave an amount. */
  amount: string | null;
};

/** The list in the order things were added. */
export function shoppingRows(data: HouseholdData): ShoppingRow[] {
  return [...data.items]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      amount:
        item.amount !== null && item.unit !== null
          ? formatAmount({ amount: item.amount, unit: item.unit, label: item.label, is_estimate: false })
          : null,
    }));
}
