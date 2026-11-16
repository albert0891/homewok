/**
 * Changes: what one action does to the household's rows.
 *
 * Every action in the app (add a food, use some, check off a shopping item) is
 * described the same way: the rows to save and the ids to remove. The app applies
 * that to its own copy right away with applyChanges, and sends the same thing to
 * the database, where apply_changes (in supabase/migrations) does it in one
 * transaction.
 */
import type { Batch, HouseholdData, Ingredient, ShoppingItem } from './rows';

export type Changes = {
  /** Rows to save. A row whose id is already there replaces the old one. */
  ingredients?: Ingredient[];
  batches?: Batch[];
  items?: ShoppingItem[];
  /** Ids of rows to remove. Removing a food also removes its purchases. */
  removeIngredients?: string[];
  removeBatches?: string[];
  removeItems?: string[];
};

/** Puts saved rows into a list: a known id is replaced in its place, a new one goes at the end. */
function save<Row extends { id: string }>(rows: Row[], saved: Row[] = []): Row[] {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const knownIds = new Set(rows.map((row) => row.id));

  return [
    ...rows.map((row) => savedById.get(row.id) ?? row),
    ...saved.filter((row) => !knownIds.has(row.id)),
  ];
}

/**
 * The household's data after the changes. It works like apply_changes in the
 * database: save first, then remove. The data passed in is left as it was.
 */
export function applyChanges(data: HouseholdData, changes: Changes): HouseholdData {
  const goneIngredients = new Set(changes.removeIngredients);
  const goneBatches = new Set(changes.removeBatches);
  const goneItems = new Set(changes.removeItems);

  return {
    ingredients: save(data.ingredients, changes.ingredients).filter(
      (row) => !goneIngredients.has(row.id),
    ),
    // A food's purchases go with it.
    batches: save(data.batches, changes.batches).filter(
      (row) => !goneBatches.has(row.id) && !goneIngredients.has(row.ingredient_id),
    ),
    // A shopping item stays, and only forgets which food it was.
    items: save(data.items, changes.items)
      .filter((row) => !goneItems.has(row.id))
      .map((row) =>
        row.ingredient_id !== null && goneIngredients.has(row.ingredient_id)
          ? { ...row, ingredient_id: null }
          : row,
      ),
  };
}

/** What turns `after` back into `before`: the rows to put back and the ids to drop. */
function wayBack<Row extends { id: string }>(before: Row[], after: Row[]) {
  const afterById = new Map(after.map((row) => [row.id, row]));
  const beforeIds = new Set(before.map((row) => row.id));

  return {
    // applyChanges hands back the very same object for a row it did not touch. So a
    // row that is now a different object, or missing, was changed or removed.
    putBack: before.filter((row) => afterById.get(row.id) !== row),
    drop: after.filter((row) => !beforeIds.has(row.id)).map((row) => row.id),
  };
}

/**
 * The changes that undo `changes`. `before` is the data as it was before they were
 * applied. This is what Undo sends.
 */
export function undoChanges(before: HouseholdData, changes: Changes): Required<Changes> {
  const after = applyChanges(before, changes);
  const ingredients = wayBack(before.ingredients, after.ingredients);
  const batches = wayBack(before.batches, after.batches);
  const items = wayBack(before.items, after.items);

  return {
    ingredients: ingredients.putBack,
    batches: batches.putBack,
    items: items.putBack,
    removeIngredients: ingredients.drop,
    removeBatches: batches.drop,
    removeItems: items.drop,
  };
}

/** The same changes under the parameter names of the database's apply_changes. */
export function toRpcArgs(changes: Changes) {
  return {
    save_ingredients: changes.ingredients ?? [],
    save_batches: changes.batches ?? [],
    save_shopping_items: changes.items ?? [],
    remove_shopping_items: changes.removeItems ?? [],
    remove_batches: changes.removeBatches ?? [],
    remove_ingredients: changes.removeIngredients ?? [],
  };
}
